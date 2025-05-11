import Framebuffer from '@core/Framebuffer';
import Program from '@core/Program';
import Vector4 from '@math/Vector4';
import Vector2 from '@math/Vector2';
import glUtils from '@core/glUtils';
import sharedProps from '@/sharedProps';
import gtaoFrag from './GTAO.frag';
import gtaoCompositeFrag from './GTAOComposite.frag';
import Effect from '../Effect';
import { FILTER } from '@core/constants';
import gBufferPass from '../../../gBufferPass/gBufferPass';
import { TYPE } from '../../../core/constants';

// GTAO implementation based on:
// https://github.com/asylum2010/Asylum_Tutorials/blob/master/ShaderTutors/54_GTAO/
// https://github.com/gkjohnson/threejs-sandbox/tree/master/gtaoPass
export default class GTAOPass extends Effect {
	name = 'GTAO';
	constructor(options = {}) {
		super(options);

		this.frameBufferScale = 0.5;

		this.intensity = 1.5;

		this.colorBounce = sharedProps.isMobile ? false : true;
		this.colorBounceIntensity = 1;

		this.directionOffset = 0;
		this.stepOffset = 0;
		this.blurStride = 1;

		this.sharedUniforms = {
			u_normalTexture: gBufferPass.sharedUniforms.u_normalRoughShadowBloom,
			u_depthTexture: gBufferPass.sharedUniforms.u_depthTexture,
			u_emissiveTexture: gBufferPass.sharedUniforms.u_emissiveAO,
			u_inputTexture: { value: null },
			u_clipInfo: { value: new Vector4() },
		};

		this.gtaoBuffer = new Framebuffer({ filter: FILTER.LINEAR, type: this.colorBounce ? TYPE.UNSIGNED_BYTE : TYPE.R8 });

		this.gtaoProgram = new Program({
			isRaw: true,
			frag: gtaoFrag,
			uniforms: {
				u_normalTexture: this.sharedUniforms.u_normalTexture,
				u_depthTexture: this.sharedUniforms.u_depthTexture,
				u_inputTexture: this.sharedUniforms.u_inputTexture,

				u_resolution: { value: new Vector2() },
				u_projInfo: { value: new Vector4() },
				u_clipInfo: this.sharedUniforms.u_clipInfo,
				u_offsetParams: { value: new Vector4() },
				u_colorBounceIntensity: { value: 1 },

				u_blueNoiseTexture: sharedProps.blueNoiseSharedUniforms.u_blueNoiseTexture,
				u_blueNoiseOffset: sharedProps.blueNoiseSharedUniforms.u_blueNoiseOffset,
				u_blueNoiseSize: sharedProps.blueNoiseSharedUniforms.u_blueNoiseSize,
			},
			defines: {
				NUM_DIRECTIONS: 2,
				NUM_STEPS: 4,
				RADIUS: '2.0',
				FALLOFF_START2: '1.0',
				FALLOFF_END2: '2.0',
				ENABLE_COLOR_BOUNCE: this.colorBounce ? 1 : 0,
			},
		});

		this.gtaoCompositeProgram = new Program({
			isRaw: true,
			frag: gtaoCompositeFrag,
			uniforms: {
				u_normalTexture: this.sharedUniforms.u_normalTexture,
				u_depthTexture: this.sharedUniforms.u_depthTexture,
				u_inputTexture: this.sharedUniforms.u_inputTexture,
				u_emissiveTexture: this.sharedUniforms.u_emissiveTexture,
				u_gtaoTexture: { value: this.gtaoBuffer.texture },

				u_fullSize: { value: new Vector2() },
				u_aoSize: { value: new Vector2() },

				u_clipInfo: this.sharedUniforms.u_clipInfo,
				u_intensity: { value: 1.0 },
				u_blurStride: { value: 1.0 },
			},
			defines: {
				BLUR_ITERATIONS: 4,
				USE_BLUR: 1,
				AO_ONLY: 0,
				COLOR_ONLY: 0,
				DEPTH_THRESHOLD: '5e-1',
				ENABLE_COLOR_BOUNCE: this.colorBounce ? 1 : 0,
			},
		});
	}

	resize(width, height) {
		const renderWidth = Math.floor(width * this.frameBufferScale);
		const renderHeight = Math.floor(height * this.frameBufferScale);
		this.gtaoBuffer.resize(renderWidth, renderHeight);
	}

	enable() {
		super.enable();
	}

	update(dt, resolution) {
		super.update(dt, resolution);
		this.resize(resolution.x, resolution.y);
	}

	render(inputTexture, outputFramebuffer) {
		super.render(inputTexture, outputFramebuffer);

		const camera = sharedProps.camera;
		this.sharedUniforms.u_inputTexture.value = inputTexture;

		// gtao
		const gtaoBuffer = this.gtaoBuffer;

		const width = Math.floor(gtaoBuffer.width);
		const height = Math.floor(gtaoBuffer.height);
		const projection = camera.projectionMatrix;
		const fovRadians = (Math.PI / 180) * camera.fov;
		this.gtaoProgram.uniforms.u_projInfo.value.set(2.0 / (width * projection[4 * 0 + 0]), 2.0 / (height * projection[4 * 1 + 1]), -1.0 / projection[4 * 0 + 0], -1.0 / projection[4 * 1 + 1]);

		this.sharedUniforms.u_clipInfo.value.set(camera.near, camera.far, 0.5 * (height / (2.0 * Math.tan(fovRadians * 0.5))), 0.0);

		this.gtaoProgram.uniforms.u_offsetParams.value.set(this.directionOffset, this.stepOffset);
		this.gtaoProgram.uniforms.u_colorBounceIntensity.value = this.colorBounceIntensity;
		this.gtaoProgram.uniforms.u_resolution.value.set(gtaoBuffer.width, gtaoBuffer.height);

		glUtils.renderProgram(this.gtaoProgram, gtaoBuffer);

		// blur and composite
		const compositeProgram = this.gtaoCompositeProgram;
		compositeProgram.uniforms.u_intensity.value = this.intensity;
		compositeProgram.uniforms.u_aoSize.value.set(gtaoBuffer.width, gtaoBuffer.height);
		compositeProgram.uniforms.u_fullSize.value.set(inputTexture.width, inputTexture.height);
		compositeProgram.uniforms.u_blurStride.value = this.blurStride;

		glUtils.renderProgram(compositeProgram, outputFramebuffer);
	}
}
