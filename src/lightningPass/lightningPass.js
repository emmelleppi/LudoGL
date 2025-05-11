import { FILTER, TYPE } from '@core/constants';
import Framebuffer from '@core/Framebuffer';
import glUtils from '@core/glUtils';
import Program from '@core/Program';
import lightingPassFrag from './lightingPassFrag.frag';
import Vector3 from '@math/Vector3';
import Matrix4 from '@math/Matrix4';
import gBufferPass from '@gBufferPass/gBufferPass';
import light from '@visuals/light/light';
import envMapGenerator from '../envMapGenerator/envMapGenerator';

class LightningPass {
	frameBuffer = null;
	program = null;

	constructor() {}

	preInit() {}

	init() {
		this.frameBuffer = new Framebuffer({
			type: TYPE.R11F_G11F_B10F,
			filter: FILTER.LINEAR,
		});

		this.program = new Program({
			isRaw: true,
			uniforms: {
				u_lightPosition: { value: light.position },

				u_albedoMetallic: gBufferPass.sharedUniforms.u_albedoMetallic,
				u_normalRoughShadowBloom: gBufferPass.sharedUniforms.u_normalRoughShadowBloom,
				u_emissiveAO: gBufferPass.sharedUniforms.u_emissiveAO,
				u_depth: gBufferPass.sharedUniforms.u_depthTexture,

				u_diffuseEnvMap: envMapGenerator.sharedUniforms.u_diffuseEnvMap,
				u_specularEnvMap: envMapGenerator.sharedUniforms.u_specularEnvMap,
				u_brdfLut: envMapGenerator.sharedUniforms.u_brdfLut,

				u_cameraPosition: { value: new Vector3(0, 0, 0) },
				u_viewMatrix: { value: new Matrix4() },
				u_inverseViewMatrix: { value: new Matrix4() },
				u_inverseProjectionMatrix: { value: new Matrix4() },

				u_near: { value: 0 },
				u_far: { value: 0 },
			},
			frag: lightingPassFrag,
			defines: envMapGenerator.defines,
		});
	}

	resize(width, height) {
		this.frameBuffer.resize(width, height);
	}

	render(camera) {
		this.program.uniforms.u_cameraPosition.value.copy(camera.position);
		this.program.uniforms.u_viewMatrix.value.copy(camera.matrixWorldInverse);
		this.program.uniforms.u_inverseViewMatrix.value.copy(camera.matrixWorld);
		this.program.uniforms.u_inverseProjectionMatrix.value.copy(camera.projectionMatrixInverse);
		this.program.uniforms.u_near.value = camera.near;
		this.program.uniforms.u_far.value = camera.far;

		glUtils.renderProgram(this.program, this.frameBuffer, true);
	}
}

export default new LightningPass();
