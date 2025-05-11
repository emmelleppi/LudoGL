import Vector2 from '@math/Vector2';
import detectUA from './detectUA';

class sharedProps {
	constructor() {
		this.fpsInterval = 1000 / 30;
		this.forceFPS = false;

		this.debugGBuffer = false;

		this.isMobile = detectUA.isMobile || detectUA.isTablet;
		this.isDesktop = detectUA.isDesktop;

		this.DPR = Math.min(1.5, window.devicePixelRatio || 1);
		this.maxPixelCount = 2560 * 1440;

		this.canvas = document.getElementById('canvas');
		this.gl = this.canvas.getContext('webgl2', {
			alpha: true,
		});

		if (!this.gl) {
			throw new Error('WebGL2 is not supported in your browser');
		}

		// Check for required WebGL2 extensions
		this.extColorBufferFloat = this.gl.getExtension('EXT_color_buffer_float');
		this.extColorBufferHalfFloat = this.gl.getExtension('EXT_color_buffer_half_float');

		if (!this.extColorBufferFloat) {
			console.warn('EXT_color_buffer_float extension is not supported. Some features may not work correctly.');
		}
		if (!this.extColorBufferHalfFloat) {
			console.warn('EXT_color_buffer_half_float extension is not supported. Some features may not work correctly.');
		}

		// Check for anisotropic extension
		this.extAnisotropic = this.gl.getExtension('EXT_texture_filter_anisotropic') || this.gl.getExtension('MOZ_EXT_texture_filter_anisotropic') || this.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');

		if (this.extAnisotropic) {
			this.maxAnisotropy = this.gl.getParameter(this.extAnisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
		} else {
			this.maxAnisotropy = 1;
		}

		// Check for sRGB extension
		this.extSRGB = this.gl.getExtension('EXT_sRGB');

		this.resolution = new Vector2();
		this.viewResolution = new Vector2();

		this.dateTime = 0;
		this.time = 0;
		this.deltaTime = 0;

		this.isReady = false;
		this.debug = true;

		this.camera = null;

		this.sharedUniforms = {
			u_resolution: {
				value: this.resolution,
			},
			u_viewResolution: {
				value: this.viewResolution,
			},
			u_aspectRatio: {
				value: 1,
			},
			u_time: {
				value: 0,
			},
			u_deltaTime: {
				value: 0,
			},
		};

		this.blueNoiseSharedUniforms = {
			u_blueNoiseTexture: { value: null },
			u_blueNoiseSize: { value: new Vector2() },
			u_blueNoiseOffset: { value: new Vector2() },
		};

		this.minRoughness = 0.027;
	}
}

export default new sharedProps();
