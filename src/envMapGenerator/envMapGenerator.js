import glUtils from '@core/glUtils';
import FrameBuffer from '@core/Framebuffer';
import sharedProps from '@/sharedProps';
import cube from '@visuals/cube/cube';
import PerspectiveCamera from '@core/PerspectiveCamera';
import BoxGeometry from '@geometries/BoxGeometry';
import Program from '@core/Program';
import Mesh from '@core/Mesh';
import iblVert from './iblVert.vert';
import diffuseFrag from './diffuseIBL.frag';
import specularFrag from './specularIBL.frag';
import brdfFrag from './brdf.frag';
import { CULL } from '@core/constants';
import { TYPE } from '../core/constants';

const ROUGHNESS_TO_MIP = {
	1024: 0.027,
	512: 0.038,
	256: 0.054,
	128: 0.076,
	64: 0.11,
	32: 0.15,
	16: 0.21,
};

class EnvMapGenerator {
	envMapSize = 256;
	diffuseMapSize = 64;
	brdfLutSize = 256;

	frameBuffer = null;
	hasBeenRendered = false;

	sharedUniforms = {
		u_diffuseEnvMap: { value: null },
		u_specularEnvMap: { value: null },
		u_brdfLut: { value: null },
	};

	defines = {
		MIN_ROUGHNESS: ROUGHNESS_TO_MIP[this.envMapSize],
		MAX_LOD: Math.floor(Math.log2(this.envMapSize)),
	};

	init() {
		this.camera = new PerspectiveCamera(90, 1, 0.01, 10);
		this.camera.updateMatrixWorld();

		this.envMapframeBuffer = new FrameBuffer({
			width: this.envMapSize,
			height: this.envMapSize,
			isCube: true,
		});

		this.diffuseFrameBuffer = new FrameBuffer({
			isHighp: true,
			width: this.diffuseMapSize,
			height: this.diffuseMapSize,
			isCube: true,
		});
		this.sharedUniforms.u_diffuseEnvMap.value = this.diffuseFrameBuffer.texture;

		this.specularFrameBuffer = new FrameBuffer({
			isHighp: true,
			width: this.envMapSize,
			height: this.envMapSize,
			isCube: true,
		});
		this.sharedUniforms.u_specularEnvMap.value = this.specularFrameBuffer.texture;

		this.brdfLutFrameBuffer = new FrameBuffer({
			isHighp: true,
			width: this.brdfLutSize,
			height: this.brdfLutSize,
			type: TYPE.RG16F,
		});
		this.sharedUniforms.u_brdfLut.value = this.brdfLutFrameBuffer.texture;

		this.diffuseProgram = new Program({
			isHighp: true,
			uniforms: {
				u_envMap: { value: this.envMapframeBuffer.texture },
			},
			vert: iblVert,
			frag: diffuseFrag,
			cullFace: CULL.FRONT,
		});

		this.specularProgram = new Program({
			isHighp: true,
			uniforms: {
				u_envMap: { value: this.envMapframeBuffer.texture },
				u_roughness: { value: 0.5 },
			},
			vert: iblVert,
			frag: specularFrag,
			cullFace: CULL.FRONT,
		});

		this.brdfProgram = new Program({
			isHighp: true,
			frag: brdfFrag,
		});

		this.cubeGeometry = new BoxGeometry(1, 1, 1);
		this.cubeMesh = new Mesh(this.cubeGeometry, this.diffuseProgram);

		this.directions = [
			{ target: [1, 0, 0], up: [0, -1, 0] }, // POSITIVE_X
			{ target: [-1, 0, 0], up: [0, -1, 0] }, // NEGATIVE_X
			{ target: [0, 1, 0], up: [0, 0, 1] }, // POSITIVE_Y
			{ target: [0, -1, 0], up: [0, 0, -1] }, // NEGATIVE_Y
			{ target: [0, 0, 1], up: [0, -1, 0] }, // POSITIVE_Z
			{ target: [0, 0, -1], up: [0, -1, 0] }, // NEGATIVE_Z
		];
	}

	renderEnvMap() {
		const gl = sharedProps.gl;

		cube.prepareForDrawEnv();

		gl.viewport(0, 0, this.envMapSize, this.envMapSize);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.envMapframeBuffer.buffer);

		for (let i = 0; i < this.directions.length; i++) {
			const cameraLookAt = this.directions[i];
			this.camera.up.set(...cameraLookAt.up);
			this.camera.lookAt(cameraLookAt.target);
			this.camera.updateProjectionMatrix();
			this.camera.updateMatrixWorld();

			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, this.envMapframeBuffer.texture.texture, 0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			for (let j = 0; j < cube.cubeMeshes.length; j++) {
				const mesh = cube.cubeMeshes[j];
				mesh.updateMatrixWorld();
				mesh.updateUniformMatrices(this.camera);
				mesh.program.use();
				mesh.geometry.draw(mesh.program);
			}
		}
		gl.finish();
	}

	renderDiffuseMap() {
		const gl = sharedProps.gl;

		gl.viewport(0, 0, this.diffuseMapSize, this.diffuseMapSize);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.diffuseFrameBuffer.buffer);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.diffuseFrameBuffer.texture.texture);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		for (let i = 0; i < this.directions.length; i++) {
			const cameraLookAt = this.directions[i];
			this.camera.up.set(...cameraLookAt.up);
			this.camera.lookAt(cameraLookAt.target);
			this.camera.updateProjectionMatrix();
			this.camera.updateMatrixWorld();

			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, this.diffuseFrameBuffer.texture.texture, 0);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			this.cubeMesh.program = this.diffuseProgram;
			this.cubeMesh.updateMatrixWorld();
			this.cubeMesh.updateUniformMatrices(this.camera);
			this.cubeMesh.program.use();
			this.cubeMesh.geometry.draw(this.cubeMesh.program);
		}
		gl.finish();
	}

	renderSpecularMap() {
		const gl = sharedProps.gl;

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.specularFrameBuffer.buffer);
		this.cubeMesh.program = this.specularProgram;

		gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.specularFrameBuffer.texture.texture);
		for (let face = 0; face < 6; face++) {
			for (let mip = 0; mip <= this.defines.MAX_LOD; mip++) {
				const mipWidth = this.envMapSize * Math.pow(0.5, mip);
				const mipHeight = this.envMapSize * Math.pow(0.5, mip);
				gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, mip, gl.RGBA16F, mipWidth, mipHeight, 0, gl.RGBA, gl.FLOAT, null);
			}
		}
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		for (let mip = 0; mip <= this.defines.MAX_LOD; mip++) {
			const mipWidth = this.envMapSize * Math.pow(0.5, mip);
			const mipHeight = this.envMapSize * Math.pow(0.5, mip);
			gl.viewport(0, 0, mipWidth, mipHeight);
			this.specularProgram.uniforms.u_roughness.value = mip / (this.defines.MAX_LOD - 1);

			for (let i = 0; i < this.directions.length; i++) {
				const cameraLookAt = this.directions[i];
				this.camera.up.set(...cameraLookAt.up);
				this.camera.lookAt(cameraLookAt.target);
				this.camera.updateProjectionMatrix();
				this.camera.updateMatrixWorld();

				gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, this.specularFrameBuffer.texture.texture, mip);
				gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

				this.cubeMesh.updateMatrixWorld();
				this.cubeMesh.updateUniformMatrices(this.camera);
				this.cubeMesh.program.use();
				this.cubeMesh.geometry.draw(this.cubeMesh.program);
			}
		}

		gl.finish();
	}

	render() {
		if (this.hasBeenRendered) return;

		this.renderEnvMap();
		this.renderDiffuseMap();
		this.renderSpecularMap();

		glUtils.renderProgram(this.brdfProgram, this.brdfLutFrameBuffer);

		this.envMapframeBuffer.dispose();
		this.diffuseProgram.dispose();
		this.specularProgram.dispose();
		this.brdfProgram.dispose();

		this.hasBeenRendered = true;
	}
}

export default new EnvMapGenerator();
