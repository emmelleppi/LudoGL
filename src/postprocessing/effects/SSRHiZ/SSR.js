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
import hiZFrag from './ssrHiZ.frag';

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

		this.frameBufferScale = sharedProps.isMobile ? 0.5 : 1;
		this.frameBufferResolution = new Vector2();
		this.ssrBuffer = new Framebuffer();
		this.blurBuffer = new Framebuffer();
		this.blurCacheBuffer = new Framebuffer();

		this.hiZBuffer = new Framebuffer();
		this.hiZCacheBuffers = [];

		this.program = new Program({
			isRaw: true,
			uniforms: {
				u_inputTexture: { value: null },
				u_normalTexture: gBufferPass.sharedUniforms.u_normalRoughShadowBloom,
				u_depthReflectionMaskTexture: { value: this.hiZBuffer.texture },
				u_resolution: sharedProps.sharedUniforms.u_resolution,
				u_targetResolution: { value: this.frameBufferResolution },
				u_invProjectionMatrix: { value: new Matrix4() },
				u_projectionMatrix: { value: new Matrix4() },
				u_cameraFar: { value: sharedProps.camera.far },

				u_blueNoiseTexture: sharedProps.blueNoiseSharedUniforms.u_blueNoiseTexture,
				u_blueNoiseOffset: sharedProps.blueNoiseSharedUniforms.u_blueNoiseOffset,
				u_blueNoiseSize: sharedProps.blueNoiseSharedUniforms.u_blueNoiseSize,

				u_stride: { value: 10 },
				u_thickness: { value: 0.15 },
				u_maxDistance: { value: 50 },
				u_reflectivityThreshold: { value: 0.5 },
				u_roughnessCutoff: { value: 0.7 },
				u_roughnessFactor: { value: 0.9 },

				u_cameraFar: { value: 0 },
				u_cameraNear: { value: 1 },

				u_hiZLevels: { value: 0 },
			},
			frag: ssrFrag,
			defines: {
				MAX_STEPS: 1000,
			},
		});

		this.blurProgram = new Program({
			isRaw: true,
			uniforms: {
				u_textureSampler: { value: null },
				u_texelOffsetScale: { value: new Vector2() },
			},
			frag: blur,
		});

		this.compositeProgram = new Program({
			isRaw: true,
			uniforms: Object.assign(
				{
					u_inputTexture: { value: null },
					u_ssrTexture: { value: null },
					u_depthReflectionMaskTexture: { value: this.hiZBuffer.texture },
					u_resolution: sharedProps.sharedUniforms.u_resolution,
					u_reflectivityThreshold: { value: 0.5 },
					u_strength: { value: 0.9 },
					u_reflectionSpecularFalloffExponent: { value: 12 },
				},
				sharedProps.blueNoiseSharedUniforms,
			),
			frag: ssrCompositeFrag,
		});

		this.hiZProgram = new Program({
			isRaw: true,
			uniforms: {
				u_depthTexture: { value: null },
				u_fromTextureSize: { value: new Vector2() },
				u_toTextureSize: { value: new Vector2() },
			},
			frag: hiZFrag,
		});
	}

	createMipmapHiZBuffer() {
		const width = sharedProps.resolution.x;
		const height = sharedProps.resolution.y;
		const maxDimension = Math.max(width, height);
		const levels = Math.min(Math.floor(Math.log2(maxDimension)), 10);

		this.hiZLevels = levels;
		this.program.uniforms.u_hiZLevels.value = levels;

		if (this.hiZCacheBuffers.length === 0 || this.hiZLevels !== levels) {
			for (let i = 0; i < levels; i++) {
				if (this.hiZCacheBuffers[i]) {
					this.hiZCacheBuffers[i].dispose();
					this.hiZCacheBuffers[i] = new Framebuffer();
				} else {
					this.hiZCacheBuffers.push(new Framebuffer());
				}
			}
		}

		for (let level = 0; level < levels; level++) {
			const mipSizeWidth = width >> level;
			const mipSizeHeight = height >> level;

			this.hiZCacheBuffers[level].resize(mipSizeWidth, mipSizeHeight);

			if (level === 0) {
				glUtils.copy(gBufferPass.sharedUniforms.u_depthReflectionMaskTexture.value, this.hiZCacheBuffers[0]);
			} else {
				const prevTexture = this.hiZCacheBuffers[level - 1].texture;
				this.hiZProgram.uniforms.u_depthTexture.value = prevTexture;
				this.hiZProgram.uniforms.u_fromTextureSize.value.set(prevTexture.width, prevTexture.height);
				this.hiZProgram.uniforms.u_toTextureSize.value.set(mipSizeWidth, mipSizeHeight);
				glUtils.renderProgram(this.hiZProgram, this.hiZCacheBuffers[level]);
			}

			sharedProps.gl.bindTexture(sharedProps.gl.TEXTURE_2D, this.hiZBuffer.texture.texture);
			sharedProps.gl.copyTexImage2D(sharedProps.gl.TEXTURE_2D, level, sharedProps.gl.RGBA, 0, 0, mipSizeWidth, mipSizeHeight, 0);
		}
	}

	update(dt) {
		super.update(dt);

		this.hiZBuffer.resize(sharedProps.resolution.x, sharedProps.resolution.y);

		const renderWidth = Math.floor(sharedProps.resolution.x * this.frameBufferScale);
		const renderHeight = Math.floor(sharedProps.resolution.y * this.frameBufferScale);

		this.frameBufferResolution.set(renderWidth, renderHeight);

		this.ssrBuffer.resize(renderWidth, renderHeight);
		this.blurCacheBuffer.resize(renderWidth, renderHeight);
		this.blurBuffer.resize(renderWidth, renderHeight);
		const camera = sharedProps.camera;
		this.program.uniforms.u_cameraFar.value = camera.far;
		this.program.uniforms.u_cameraNear.value = camera.near;
	}

	render(inputTexture, outputFramebuffer) {
		super.render(inputTexture, outputFramebuffer);

		this.createMipmapHiZBuffer();

		const camera = sharedProps.camera;

		this.program.uniforms.u_inputTexture.value = inputTexture;
		this.program.uniforms.u_invProjectionMatrix.value.copy(camera.projectionMatrixInverse);
		this.program.uniforms.u_projectionMatrix.value.copy(camera.projectionMatrix);
		glUtils.renderProgram(this.program, this.ssrBuffer);

		let delta = 0.1;
		this.blurProgram.uniforms.u_textureSampler.value = this.ssrBuffer.textures[0];
		this.blurProgram.uniforms.u_texelOffsetScale.value.set(delta / this.frameBufferResolution.x, 0);
		glUtils.renderProgram(this.blurProgram, this.blurCacheBuffer);

		this.blurProgram.uniforms.u_textureSampler.value = this.blurCacheBuffer.textures[0];
		this.blurProgram.uniforms.u_texelOffsetScale.value.set(0, delta / this.frameBufferResolution.y);
		glUtils.renderProgram(this.blurProgram, this.blurBuffer);

		this.compositeProgram.uniforms.u_inputTexture.value = inputTexture;
		this.compositeProgram.uniforms.u_ssrTexture.value = this.blurBuffer.textures[0];
		glUtils.renderProgram(this.compositeProgram, outputFramebuffer);
	}
}
