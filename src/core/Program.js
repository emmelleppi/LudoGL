import blitVert from '@glsl/blit.vert';
import blitFrag from '@glsl/blit.frag';
import glUtils from '@core/glUtils';
import sharedProps from '@/sharedProps';
import Matrix4 from '@math/Matrix4';
import Matrix3 from '@math/Matrix3';
import { CULL, DEPTH, BLEND, BLEND_EQUATIONS, BLEND_FACTORS } from '@core/constants';
import Vector3 from '@math/Vector3';

export const DEFAULT_UNIFORMS = {
	viewProjectionMatrix: 'mat4',
	viewProjectionMatrixJittered: 'mat4', // for TAA
	projectionMatrix: 'mat4',
	modelViewMatrix: 'mat4',
	modelMatrix: 'mat4',
	viewMatrix: 'mat4',
	normalMatrix: 'mat3',
	cameraPosition: 'vec3',
	cameraNear: 'float',
	cameraFar: 'float',
	prevModelMatrix: 'mat4', // for TAA
	prevViewProjectionMatrix: 'mat4', // for TAA
};
export default class Program {
	static chunks = new Map();

	constructor(opts = {}) {
		this.type = 'Program';
		this.isRaw = opts.isRaw || false;

		this.uniforms = Object.assign(
			opts.uniforms || {},
			this.isRaw
				? {}
				: {
						projectionMatrix: { value: new Matrix4() },
						viewProjectionMatrix: { value: new Matrix4() },
						modelViewMatrix: { value: new Matrix4() },
						modelMatrix: { value: new Matrix4() },
						viewMatrix: { value: new Matrix4() },
						normalMatrix: { value: new Matrix3() },
						cameraPosition: { value: new Vector3() },
						cameraNear: { value: 0.0 },
						cameraFar: { value: 1.0 },
						prevModelMatrix: { value: new Matrix4() }, // for TAA
						prevViewProjectionMatrix: { value: new Matrix4() }, // for TAA
						viewProjectionMatrixJittered: { value: new Matrix4() }, // for TAA
					},
		);

		this.glUniforms = {};
		this.glAttributes = {};

		this.vert = opts.vert || blitVert;
		this.frag = opts.frag || blitFrag;

		this.depthTest = opts.depthTest || true;
		this.depthFunc = opts.depthFunc || DEPTH.LEQUAL;
		this.depthWrite = opts.depthWrite !== undefined ? opts.depthWrite : true;

		this.cullFace = opts.cullFace || CULL.BACK;

		// Use blend constants
		const blendMode = opts.blendMode || BLEND.NONE;
		this.blend = blendMode.blendEnabled;
		this.blendHasAlpha = blendMode.blendFunc?.srcAlpha || false;
		this.blendEquation = blendMode.blendFunc?.equation || BLEND_EQUATIONS.ADD;
		this.blendSrc = blendMode.blendFunc?.src || BLEND_FACTORS.SRC_ALPHA;
		this.blendDst = blendMode.blendFunc?.dst || BLEND_FACTORS.ONE_MINUS_SRC_ALPHA;

		this.blendEquationAlpha = blendMode.blendFunc?.equationAlpha || BLEND_EQUATIONS.ADD;
		this.blendSrcAlpha = blendMode.blendFunc?.srcAlpha || BLEND_FACTORS.ONE;
		this.blendDstAlpha = blendMode.blendFunc?.dstAlpha || BLEND_FACTORS.ONE_MINUS_SRC_ALPHA;

		this.defines = opts.defines || {};

		this.isHighp = opts.isHighp || false;
	}

	static addChunk(name, chunk) {
		Program.chunks.set(name, chunk);
	}

	static getChunk(name) {
		return Program.chunks.get(name);
	}

	_compile() {
		let gl = sharedProps.gl;

		let vert = this._compileShader(gl.VERTEX_SHADER, this.vert);
		let frag = this._compileShader(gl.FRAGMENT_SHADER, this.frag);

		let program = (this.program = gl.createProgram());

		gl.attachShader(program, vert);
		gl.attachShader(program, frag);
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
		}

		// Cache uniform locations
		const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
		for (let i = 0; i < uniformCount; i++) {
			const uniformInfo = gl.getActiveUniform(program, i);
			const id = uniformInfo.name;
			this.glUniforms[id] = {
				location: gl.getUniformLocation(program, id),
				structure: glUtils.uniformStructures[uniformInfo.type],
			};
		}

		// Cache attribute locations
		const attributeCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
		for (let i = 0; i < attributeCount; i++) {
			const attributeInfo = gl.getActiveAttrib(program, i);
			const id = attributeInfo.name;
			const location = gl.getAttribLocation(program, id);
			if (location !== -1) {
				this.glAttributes[id] = { location };
			}
		}
	}

	_compileShader(type, source) {
		const gl = sharedProps.gl;
		const shader = gl.createShader(type);

		// Inject WebGL2 version and precision declarations if not already present
		const versionDecl = '#version 300 es';
		const precisionDecl = type === gl.VERTEX_SHADER || this.isHighp ? 'precision highp float;\nprecision highp int;' : 'precision mediump float;\nprecision mediump int;';
		const defaultUniforms = Object.entries(this.isRaw ? {} : DEFAULT_UNIFORMS)
			.map(([key, type]) => `uniform ${type} ${key};`)
			.join('\n');

		const defines = Object.entries(this.defines)
			.map(([key, value]) => `#define ${key} ${value}\n`)
			.join('');

		if (!source.includes(versionDecl)) {
			source = `${versionDecl}\n${source}`;
		}
		if (!source.includes(precisionDecl)) {
			source = source.replace(versionDecl, `${versionDecl}\n${precisionDecl}`);
		}
		source = source.replace(precisionDecl, `${precisionDecl}\n${defines}${defaultUniforms}`);
		source = this._checkForChunks(source);

		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}

	_checkForChunks(source) {
		// Check for #include<chunkName> directives and replace with chunk content if exists
		const includeRegex = /#include<(\w+)>/g;
		let match;

		while ((match = includeRegex.exec(source)) !== null) {
			const chunkName = match[1];
			const chunk = Program.getChunk(chunkName);
			if (chunk) {
				source = source.replace(match[0], chunk);
			}
		}

		return source;
	}

	use() {
		const gl = sharedProps.gl;

		// Compile program if needed
		if (!this.program) {
			this._compile();
		}
		gl.useProgram(this.program);

		// Set uniforms
		let activeTextureUnit = 0;
		for (const id in this.glUniforms) {
			const uniform = this.glUniforms[id];
			//   console.log(id)
			const value = this.uniforms[id].value;

			if (uniform.structure.isSampler3D) {
				gl.activeTexture(gl['TEXTURE' + activeTextureUnit]);
				gl.bindTexture(gl.TEXTURE_3D, value?.texture);
				gl[uniform.structure.func](uniform.location, activeTextureUnit++);
			} else if (uniform.structure.isTexture) {
				gl.activeTexture(gl['TEXTURE' + activeTextureUnit]);
				gl.bindTexture(gl.TEXTURE_2D, value?.texture);
				gl[uniform.structure.func](uniform.location, activeTextureUnit++);
			} else if (uniform.structure.isSamplerCube) {
				gl.activeTexture(gl['TEXTURE' + activeTextureUnit]);
				gl.bindTexture(gl.TEXTURE_CUBE_MAP, value?.texture);
				gl[uniform.structure.func](uniform.location, activeTextureUnit++);
			} else if (uniform.structure.isMatrix) {
				gl[uniform.structure.func + uniform.structure.size + 'fv'](uniform.location, false, value);
			} else {
				const func = uniform.structure.func;
				switch (uniform.structure.size) {
					case 1:
						gl[func](uniform.location, value);
						break;
					case 2:
						gl[func](uniform.location, value[0], value[1]);
						break;
					case 3:
						gl[func](uniform.location, value[0], value[1], value[2]);
						break;
					case 4:
						gl[func](uniform.location, value[0], value[1], value[2], value[3]);
						break;
				}
			}
		}

		// Set blend state
		if (this.blend) {
			gl.enable(gl.BLEND);
			if (this.blendHasAlpha) {
				gl.blendEquationSeparate(this.blendEquation, this.blendEquationAlpha);
				gl.blendFuncSeparate(this.blendSrc, this.blendDst, this.blendSrcAlpha, this.blendDstAlpha);
			} else {
				gl.blendEquation(this.blendEquation);
				gl.blendFunc(this.blendSrc, this.blendDst);
			}
		} else {
			gl.disable(gl.BLEND);
		}

		// Set depth state
		if (this.depthTest) {
			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(this.depthFunc);
		} else {
			gl.disable(gl.DEPTH_TEST);
		}
		gl.depthMask(this.depthWrite);

		// Set face culling
		if (this.cullFace) {
			gl.enable(gl.CULL_FACE);
			gl.cullFace(this.cullFace);
		} else {
			gl.disable(gl.CULL_FACE);
		}
	}

	dispose() {
		const gl = sharedProps.gl;
		gl.deleteProgram(this.program);
	}
}
