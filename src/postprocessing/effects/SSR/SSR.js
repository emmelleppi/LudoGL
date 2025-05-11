import Framebuffer from '@core/Framebuffer';
import glUtils from '@core/glUtils';
import Program from '@core/Program';
import gBufferPass from '@gBufferPass/gBufferPass';
import Matrix4 from '@math/Matrix4';
import Vector2 from '@math/Vector2';
import sharedProps from '@/sharedProps';
import Effect from '../Effect';
import ssrFrag from './ssr.frag';
import ssrCompositeFrag from './ssrComposite.frag';
import blur from './ssrBlur.frag';
import envMapGenerator from '../../../envMapGenerator/envMapGenerator';
import { FILTER } from '../../../core/constants';

// SSR - Screen Space Reflections
// based on
// https://casual-effects.blogspot.com/2014/08/screen-space-ray-tracing.html
// https://willpgfx.com/2015/07/screen-space-glossy-reflections/
// https://github.com/BabylonJS/Babylon.js/blob/7aee9a791e1427deab6e83a339d1594171fa62cf/packages/dev/core/src/Shaders/screenSpaceReflection2.fragment.fx#L55
// https://sugulee.wordpress.com/2021/01/19/screen-space-reflections-implementation-and-optimization-part-2-hi-z-tracing-method/
// https://github.com/gkjohnson/threejs-sandbox/tree/a355ac0fb9212ba13a4dd01b804d45f21d72c289/screenSpaceReflectionsPass
//
export default class SSR extends Effect {
	name = 'SSR';
	constructor(options = {}) {
		super(options);

		this.frameBufferScale = sharedProps.isMobile ? 0.5 : 0.75;
		this.frameBufferResolution = new Vector2();
		this.ssrBuffer = new Framebuffer({ filter: FILTER.LINEAR });
		this.blurBuffer = new Framebuffer({ filter: FILTER.LINEAR });
		this.blurCacheBuffer = new Framebuffer({ filter: FILTER.LINEAR });

		this.roughnessCutoff = 0.25;

		this.program = new Program({
			uniforms: {
				u_inputTexture: { value: null },
				u_normalRoughShadowBloom: gBufferPass.sharedUniforms.u_normalRoughShadowBloom,
				u_depthTexture: gBufferPass.sharedUniforms.u_depthTexture,

				u_resolution: sharedProps.sharedUniforms.u_resolution,
				u_targetResolution: { value: this.frameBufferResolution },

				u_invProjectionMatrix: { value: new Matrix4() },
				u_projectionMatrix: { value: new Matrix4() },

				u_blueNoiseTexture: sharedProps.blueNoiseSharedUniforms.u_blueNoiseTexture,
				u_blueNoiseOffset: sharedProps.blueNoiseSharedUniforms.u_blueNoiseOffset,
				u_blueNoiseSize: sharedProps.blueNoiseSharedUniforms.u_blueNoiseSize,

				u_stride: { value: 20 },
				u_thickness: { value: 0.25 },
				u_maxDistance: { value: 20 },
				u_roughnessCutoff: { value: this.roughnessCutoff },
				u_blurFactor: { value: 0.05 },

				u_envMap: envMapGenerator.sharedUniforms.u_specularEnvMap,
			},
			frag: ssrFrag,
			defines: {
				MAX_STEPS: 100,
			},
		});

		this.blurProgram = new Program({
			uniforms: {
				u_textureSampler: { value: null },
				u_texelOffsetScale: { value: new Vector2() },
				u_isFinalPass: { value: 0 },
			},
			frag: blur,
		});

		this.compositeProgram = new Program({
			uniforms: Object.assign(
				{
					u_inputTexture: { value: null },
					u_ssrTexture: { value: null },
					u_normalRoughShadowBloom: gBufferPass.sharedUniforms.u_normalRoughShadowBloom,
					u_resolution: sharedProps.sharedUniforms.u_resolution,
					u_roughnessCutoff: { value: this.roughnessCutoff },
					u_strength: { value: 0.8 },
					u_reflectionSpecularFalloffExponent: { value: 10 },
				},
				sharedProps.blueNoiseSharedUniforms,
			),
			frag: ssrCompositeFrag,
		});
	}

	update(dt) {
		super.update(dt);

		const renderWidth = Math.floor(sharedProps.resolution.x * this.frameBufferScale);
		const renderHeight = Math.floor(sharedProps.resolution.y * this.frameBufferScale);

		this.frameBufferResolution.set(renderWidth, renderHeight);

		this.ssrBuffer.resize(renderWidth, renderHeight);
		this.blurCacheBuffer.resize(renderWidth, renderHeight);
		this.blurBuffer.resize(renderWidth, renderHeight);
	}

	render(inputTexture, outputFramebuffer) {
		super.render(inputTexture, outputFramebuffer);

		const camera = sharedProps.camera;

		this.program.uniforms.u_inputTexture.value = inputTexture;
		this.program.uniforms.u_invProjectionMatrix.value.copy(camera.projectionMatrixInverse);
		this.program.uniforms.u_projectionMatrix.value.copy(camera.projectionMatrix);
		glUtils.renderProgram(this.program, this.ssrBuffer);

		let delta = 0.03;
		this.blurProgram.uniforms.u_textureSampler.value = this.ssrBuffer.textures[0];
		this.blurProgram.uniforms.u_texelOffsetScale.value.set(delta / this.frameBufferResolution.x, 0);
		this.blurProgram.uniforms.u_isFinalPass.value = 0;
		glUtils.renderProgram(this.blurProgram, this.blurCacheBuffer);

		this.blurProgram.uniforms.u_textureSampler.value = this.blurCacheBuffer.textures[0];
		this.blurProgram.uniforms.u_texelOffsetScale.value.set(0, delta / this.frameBufferResolution.y);
		this.blurProgram.uniforms.u_isFinalPass.value = 1;
		glUtils.renderProgram(this.blurProgram, this.blurBuffer);

		this.compositeProgram.uniforms.u_inputTexture.value = inputTexture;
		this.compositeProgram.uniforms.u_ssrTexture.value = this.blurBuffer.textures[0];
		glUtils.renderProgram(this.compositeProgram, outputFramebuffer);
	}
}
