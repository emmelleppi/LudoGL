import Program from '@core/Program';
import convolutionDownVert from './convolutionDown.vert';
import convolutionDownFrag from './convolutionDown.frag';
import convolutionUpVert from './convolutionUp.vert';
import convolutionUpFrag from './convolutionUp.frag';
import Vector2 from '@math/Vector2';
import glUtils from '@core/glUtils';
import Framebuffer from '@core/Framebuffer';
import { FILTER, TYPE } from '@core/constants';
import sharedProps from '../../../sharedProps';

// Based on:
// https://github.com/pmndrs/postprocessing/blob/fc9ed867f2b0f954e5329545e6c58b1a60f399f0/src/passes/MipmapBlurPass.js
export class MipmapBlurPass {
	frameBuffer = null;
	texture = null;
	resolution = new Vector2();
	levels = sharedProps.isMobile ? 4 : 5;

	constructor() {
		this.downsamplingMipmaps = [];
		this.upsamplingMipmaps = [];

		this.downsamplingMaterial = new Program({
			isRaw: true,
			vert: convolutionDownVert,
			frag: convolutionDownFrag,
			uniforms: {
				u_inputTexture: { value: null },
				u_texelSize: { value: new Vector2() },
			},
		});

		this.upsamplingMaterial = new Program({
			isRaw: true,
			vert: convolutionUpVert,
			frag: convolutionUpFrag,
			uniforms: {
				u_inputTexture: { value: null },
				u_supportTexture: { value: null },
				u_texelSize: { value: new Vector2() },
				u_radius: { value: 0.9 },
			},
		});
	}

	init() {
		const frameBuffer = this.frameBuffer;

		for (let i = 0; i < this.levels; ++i) {
			const mipmap = frameBuffer.clone();
			this.downsamplingMipmaps.push(mipmap);
		}
		this.upsamplingMipmaps.push(frameBuffer);
		for (let i = 1, l = this.levels - 1; i < l; ++i) {
			const mipmap = frameBuffer.clone();
			this.upsamplingMipmaps.push(mipmap);
		}
	}

	render(inputBuffer) {
		if (!this.frameBuffer) {
			this.frameBuffer = new Framebuffer({
				filter: FILTER.LINEAR,
				type: TYPE.HALF_FLOAT,
			});
			this.texture = this.frameBuffer.texture;
			this.init();
		}
		this.resize(inputBuffer.width, inputBuffer.height);

		const { downsamplingMaterial, upsamplingMaterial } = this;
		const { downsamplingMipmaps, upsamplingMipmaps } = this;

		let previousBuffer = inputBuffer;
		let texelScale = 1;

		// Downsample the input to the highest MIP level (smallest mipmap).
		for (let i = 0, l = downsamplingMipmaps.length; i < l; ++i) {
			const mipmap = downsamplingMipmaps[i];
			downsamplingMaterial.uniforms.u_inputTexture.value = previousBuffer.texture;
			downsamplingMaterial.uniforms.u_texelSize.value.set(texelScale / previousBuffer.width, texelScale / previousBuffer.height);
			glUtils.renderProgram(downsamplingMaterial, mipmap);
			previousBuffer = mipmap;
		}

		for (let i = upsamplingMipmaps.length - 1; i >= 0; --i) {
			const mipmap = upsamplingMipmaps[i];
			upsamplingMaterial.uniforms.u_inputTexture.value = previousBuffer.texture;
			upsamplingMaterial.uniforms.u_supportTexture.value = downsamplingMipmaps[i].texture;
			upsamplingMaterial.uniforms.u_texelSize.value.set(texelScale / previousBuffer.width, texelScale / previousBuffer.height);
			glUtils.renderProgram(upsamplingMaterial, mipmap);
			previousBuffer = mipmap;
		}
	}

	resize(width, height) {
		const resolution = this.resolution;

		if (width === resolution.x && height === resolution.y) {
			return;
		}
		resolution.set(width, height);

		let w = resolution.x,
			h = resolution.y;

		for (let i = 0, l = this.downsamplingMipmaps.length; i < l; ++i) {
			w = Math.round(w * 0.5);
			h = Math.round(h * 0.5);
			this.downsamplingMipmaps[i].resize(w, h);
			if (i < this.upsamplingMipmaps.length) {
				this.upsamplingMipmaps[i].resize(w, h);
			}
		}
	}
}
