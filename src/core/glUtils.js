import sharedProps from '@/sharedProps';
import Program from '@core/Program';
import Mesh from '@core/Mesh';
import Geometry from '@core/Geometry';
import Camera from '@core/Camera';
import toneMappingFrag from '@glsl/acesToneMapping.glsl';

import debugColorFrag from '@glsl/debugColor.frag';
import debugAlphaFrag from '@glsl/debugAlpha.frag';
import debugPackedDepthFrag from '@glsl/debugPackedDepth.frag';
import debugLinearDepthFrag from '@glsl/debugLinearDepth.frag';
import debugDepthBufferFrag from '@glsl/debugDepthBuffer.frag';
import debugCubeFrag from '@glsl/debugCube.frag';

import common from '@glsl/common.glsl';
import colorSpace from '@glsl/colorSpace.glsl';
import rgbDepthPackage from '@glsl/rgbDepthPackage.glsl';
import velocityFromDepths from '@glsl/velocityFromDepths.glsl';
import gbufferUtils from '@glsl/gbufferUtils.glsl';
import getShadowMask from '@glsl/getShadowMask.glsl';

class GlUtils {
	triAttribute;
	uniformStructures = {};

	clearColorTransparent = [0, 0, 0, 0];
	clearColorBlack = [0, 0, 0, 1];
	clearColorWhite = [1, 1, 1, 1];
	clearColor = this.clearColorTransparent;

	init() {
		Program.addChunk('acesToneMapping', toneMappingFrag);
		Program.addChunk('colorSpace', colorSpace);
		Program.addChunk('common', common);
		Program.addChunk('rgbDepthPackage', rgbDepthPackage);
		Program.addChunk('velocityFromDepths', velocityFromDepths);
		Program.addChunk('gbufferUtils', gbufferUtils);
		Program.addChunk('getShadowMask', getShadowMask);
		this.initUniformTypes();

		this._camera = new Camera();
		this._camera.position.z = 1;

		this.triGeometry = new Geometry();
		this.triGeometry.setAttribute('position', new Float32Array([-1, -1, 4, -1, -1, 4]), 2);

		this.copyProgram = new Program({
			uniforms: {
				u_texture: { value: null },
			},
		});
		this.copyMesh = new Mesh(this.triGeometry, this.copyProgram);

		this.debugProgram = new Program({
			uniforms: {
				u_texture: { value: null },
			},
		});

		this.debugAlphaProgram = new Program({
			uniforms: {
				u_texture: { value: null },
			},
			frag: debugAlphaFrag,
		});

		this.debugColorProgram = new Program({
			uniforms: {
				u_texture: { value: null },
			},
			frag: debugColorFrag,
		});

		this.debugPackedDepthProgram = new Program({
			uniforms: {
				u_texture: { value: null },
			},
			frag: debugPackedDepthFrag,
		});

		this.debugLinearDepthProgram = new Program({
			uniforms: {
				u_texture: { value: null },
				u_near: { value: 0 },
				u_far: { value: 0 },
			},
			frag: debugLinearDepthFrag,
		});

		this.debugDepthBufferProgram = new Program({
			uniforms: {
				u_texture: { value: null },
				u_near: { value: 0 },
				u_far: { value: 0 },
			},
			frag: debugDepthBufferFrag,
		});

		this.debugCubeProgram = new Program({
			uniforms: {
				u_texture: { value: null },
			},
			frag: debugCubeFrag,
		});

		this.debugMesh = new Mesh(this.triGeometry, this.debugProgram);

		this.renderMesh = new Mesh(this.triGeometry);
	}

	initUniformTypes() {
		let gl = sharedProps.gl;
		let unformTypes = ['FLOAT', 'FLOAT_VEC2', 'FLOAT_VEC3', 'FLOAT_VEC4', 'INT', 'INT_VEC2', 'INT_VEC3', 'INT_VEC4', 'BOOL', 'BOOL_VEC2', 'BOOL_VEC3', 'BOOL_VEC4', 'FLOAT_MAT2', 'FLOAT_MAT3', 'FLOAT_MAT4', 'SAMPLER_2D', 'SAMPLER_CUBE', 'SAMPLER_3D'];

		for (let i = 0; i < unformTypes.length; i++) {
			let type = unformTypes[i];
			let uniformStructure = {};

			uniformStructure.isMatrix = type.indexOf('MAT') > -1;
			uniformStructure.isInt = type.indexOf('INT') > -1;
			uniformStructure.size = parseInt((type.match(/\d+/) || ['1'])[0], 10);
			uniformStructure.isTexture = type.indexOf('SAMPLER_2D') > -1;
			uniformStructure.isSampler3D = type.indexOf('SAMPLER_3D') > -1;
			uniformStructure.isSamplerCube = type.indexOf('SAMPLER_CUBE') > -1;

			if (uniformStructure.isTexture) {
				uniformStructure.func = 'uniform1i';
			} else if (uniformStructure.isSampler3D) {
				uniformStructure.func = 'uniform1i';
			} else if (uniformStructure.isSamplerCube) {
				uniformStructure.func = 'uniform1i';
			} else if (uniformStructure.isMatrix) {
				uniformStructure.func = uniformStructure.isInt ? 'uniformMatrix' : 'uniformMatrix';
			} else if (uniformStructure.isInt) {
				uniformStructure.func = 'uniform' + uniformStructure.size + 'i';
			} else {
				uniformStructure.func = 'uniform' + uniformStructure.size + 'f';
			}

			this.uniformStructures[gl[unformTypes[i]]] = uniformStructure;
		}
	}

	clearScreen() {
		let gl = sharedProps.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clearColor(...this.clearColor);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}

	render(mesh, camera = null, glFramebuffer = null, clear = false) {
		let gl = sharedProps.gl;

		if (glFramebuffer) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, glFramebuffer.buffer);
			gl.viewport(0, 0, glFramebuffer.width, glFramebuffer.height);
		} else {
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		}

		if (clear) {
			gl.enable(gl.DEPTH_TEST);
			gl.depthMask(true);
			gl.clearColor(...this.clearColor);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		}

		mesh.draw(camera);
	}

	renderProgram(program, glFramebuffer = null, clear = false) {
		this.renderMesh.program = program;
		this.render(this.renderMesh, this._camera, glFramebuffer, clear);
	}

	copy(sourceTexture, destFBO) {
		// this.copyProgram.uniforms.u_texture.value = texture;
		// this.render(this.copyMesh, this._camera, targetFbo);
		let gl = sharedProps.gl;

		if (!this.sourceFBO) {
			this.sourceFBO = gl.createFramebuffer();
		}
		gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.sourceFBO);
		gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sourceTexture.texture, 0);
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, destFBO.buffer);
		gl.blitFramebuffer(
			0,
			0,
			sourceTexture.width,
			sourceTexture.height, // src rect
			0,
			0,
			destFBO.width,
			destFBO.height, // dst rect
			gl.COLOR_BUFFER_BIT,
			gl.NEAREST,
		);
	}

	renderToScreen(texture) {
		this.copy(texture, null);
	}

	debug(texture, height = 500, x = 0, y = 0) {
		this.debugMesh.program = this.debugProgram;
		this.debugProgram.uniforms.u_texture.value = texture;

		const aspectRatio = texture.width / texture.height;
		const width = Math.floor(height * aspectRatio);

		this.drawDebug(width, height, x, y);
	}

	debugAlpha(texture, height = 500, x = 0, y = 0) {
		this.debugMesh.program = this.debugAlphaProgram;
		this.debugAlphaProgram.uniforms.u_texture.value = texture;

		const aspectRatio = texture.width / texture.height;
		const width = Math.floor(height * aspectRatio);

		this.drawDebug(width, height, x, y);
	}

	debugColor(texture, height = 500, x = 0, y = 0) {
		this.debugMesh.program = this.debugColorProgram;
		this.debugColorProgram.uniforms.u_texture.value = texture;

		const aspectRatio = texture.width / texture.height;
		const width = Math.floor(height * aspectRatio);

		this.drawDebug(width, height, x, y);
	}

	debugPackedDepth(texture, height = 500, x = 0, y = 0) {
		this.debugMesh.program = this.debugPackedDepthProgram;
		this.debugPackedDepthProgram.uniforms.u_texture.value = texture;

		const aspectRatio = texture.width / texture.height;
		const width = Math.floor(height * aspectRatio);

		this.drawDebug(width, height, x, y);
	}

	debugLinearDepth(texture, height = 500, x = 0, y = 0, near = 0, far = 0) {
		this.debugMesh.program = this.debugLinearDepthProgram;
		this.debugLinearDepthProgram.uniforms.u_texture.value = texture;
		this.debugLinearDepthProgram.uniforms.u_near.value = near;
		this.debugLinearDepthProgram.uniforms.u_far.value = far;

		const aspectRatio = texture.width / texture.height;
		const width = Math.floor(height * aspectRatio);

		this.drawDebug(width, height, x, y);
	}

	debugDepthBuffer(texture, height = 500, x = 0, y = 0, near = 0, far = 0) {
		this.debugMesh.program = this.debugDepthBufferProgram;
		this.debugDepthBufferProgram.uniforms.u_texture.value = texture;
		this.debugDepthBufferProgram.uniforms.u_near.value = near;
		this.debugDepthBufferProgram.uniforms.u_far.value = far;

		const aspectRatio = texture.width / texture.height;
		const width = Math.floor(height * aspectRatio);

		this.drawDebug(width, height, x, y);
	}

	debugCube(texture, height = 500, x = 0, y = 0) {
		this.debugMesh.program = this.debugCubeProgram;
		this.debugCubeProgram.uniforms.u_texture.value = texture;

		const aspectRatio = texture.width / texture.height;
		const width = Math.floor(height * aspectRatio);

		this.drawDebug(width, height, x, y);
	}

	drawDebug(width = 1, height = 1, x = 0, y = 0) {
		let gl = sharedProps.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(x, gl.canvas.height - y - height, width, height);
		gl.disable(gl.DEPTH_TEST);
		gl.depthMask(false);
		this.debugMesh.draw(this._camera);
	}
}

export default new GlUtils();
