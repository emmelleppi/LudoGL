import { FILTER, WRAP } from '@core/constants';
import Framebuffer from '@core/Framebuffer';
import glUtils from '@core/glUtils';
import Program from '@core/Program';
import Vector2 from '@math/Vector2';
import sharedProps from '@/sharedProps';
import Effect from '../Effect';
import bloomFragmentShader from './bloom.frag';
import luminanceFragmentShader from './luminance.frag';
import { MipmapBlurPass } from './MipmapBlurPass';
import Texture from '@core/Texture';
import gBufferPass from '../../../gBufferPass/gBufferPass';
import visuals from '../../../visuals/visuals';

// Bloom effect based  on
// https://github.com/pmndrs/postprocessing/blob/fc9ed867f2b0f954e5329545e6c58b1a60f399f0/src/effects/BloomEffect.js
// https://www.froyok.fr/blog/2021-12-ue4-custom-bloom/
// https://john-chapman.github.io/2017/11/05/pseudo-lens-flare.html
// https://github.com/JamShan/GfxSamples/tree/master/data/LensFlare_ScreenSpace
export default class Bloom extends Effect {
	name = 'Bloom';
	intensity = 8;
	haloIntensity = 1;
	frameBufferScale = 0.5;
	frameBuffer = null;
	luminanceProgram = null;
	mipmapBlurPass = null;

	constructor(options = {}) {
		super(options);

		this.bloomProgram = new Program({
			isRaw: true,
			frag: bloomFragmentShader,
			uniforms: Object.assign({
				u_inputTexture: { value: null },
				u_textureSize: { value: new Vector2() },
				u_aspectRatio: sharedProps.sharedUniforms.u_aspectRatio,

				u_bloomTexture: { value: null },
				u_bloomIntensity: { value: this.intensity },

				u_starburstTexture: { value: null },
				u_starburstOffset: { value: 0 },
				u_dirtMaskTexture: { value: null },
				u_dirtMaskAspectRatio: { value: 1 },
			}),
		});

		this.luminanceProgram = new Program({
			isRaw: true,
			frag: luminanceFragmentShader,
			uniforms: {
				u_threshold: { value: 0.25 },
				u_smoothing: { value: 0.02 },
				u_halo: { value: this.haloIntensity },
				u_haloRadius: { value: 0.5 },
				u_haloThickness: { value: 0.5 },
				u_haloThreshold: { value: 0.5 },
				u_ghostThreshold: { value: 0.25 },
				u_ghostSpacing: { value: 1.25 },
				u_ghostCount: { value: 2 },

				u_inputTexture: { value: null },
				u_gradientTexture: { value: null },
				u_aspectRatio: sharedProps.sharedUniforms.u_aspectRatio,
				u_normalRoughShadowBloom: gBufferPass.sharedUniforms.u_normalRoughShadowBloom,
				u_emissiveTexture: gBufferPass.sharedUniforms.u_emissiveAO,
			},
		});
		this.mipmapBlurPass = new MipmapBlurPass();

		this.dirtMaskTexture = new Texture(null, 1, 1, {
			filter: FILTER.LINEAR,
		});
		this.dirtMaskTexture.loadImage('/bloom/dirtmasktexture.png', () => {
			this.bloomProgram.uniforms.u_dirtMaskTexture.value = this.dirtMaskTexture;
			this.bloomProgram.uniforms.u_dirtMaskAspectRatio.value = this.dirtMaskTexture.width / this.dirtMaskTexture.height;
		});

		this.starburstTexture = new Texture(null, 1, 1, {
			filter: FILTER.LINEAR,
			wrap: WRAP.REPEAT,
		});
		this.starburstTexture.loadImage('/bloom/starburst.png', () => {
			this.bloomProgram.uniforms.u_starburstTexture.value = this.starburstTexture;
		});

		this.gradientTexture = new Texture(null, 1, 1, {
			filter: FILTER.LINEAR,
		});
		this.gradientTexture.loadImage('/bloom/gradient_flare.png', () => {
			this.luminanceProgram.uniforms.u_gradientTexture.value = this.gradientTexture;
		});
	}

	resize(width, height) {
		const renderWidth = Math.floor(width * this.frameBufferScale);
		const renderHeight = Math.floor(height * this.frameBufferScale);
		if (this.frameBuffer) {
			this.frameBuffer.resize(renderWidth, renderHeight);
		}
	}

	update(dt, resolution) {
		super.update(dt);
		this.resize(resolution.x, resolution.y);
	}

	render(inputBuffer, outputBuffer) {
		super.render(inputBuffer, outputBuffer);
		if (!this.frameBuffer) {
			this.frameBuffer = new Framebuffer({ filter: FILTER.LINEAR });
		}

		this.luminanceProgram.uniforms.u_inputTexture.value = inputBuffer;
		this.luminanceProgram.uniforms.u_threshold.value = visuals.showHelmet ? 0.7 : 0.25;
		this.luminanceProgram.uniforms.u_smoothing.value = visuals.showHelmet ? 0.1 : 0.02;
		glUtils.renderProgram(this.luminanceProgram, this.frameBuffer);

		this.mipmapBlurPass.render(this.frameBuffer);

		this.bloomProgram.uniforms.u_inputTexture.value = inputBuffer;
		this.bloomProgram.uniforms.u_bloomTexture.value = this.mipmapBlurPass.texture;
		this.bloomProgram.uniforms.u_textureSize.value.set(this.mipmapBlurPass.texture.width, this.mipmapBlurPass.texture.height);
		this.bloomProgram.uniforms.u_starburstOffset.value = 0.009 * sharedProps.time;

		glUtils.renderProgram(this.bloomProgram, outputBuffer);
	}
}
