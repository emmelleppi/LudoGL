import glUtils from '@core/glUtils';
import Program from '@core/Program';
import gBufferPass from '@gBufferPass/gBufferPass';
import sharedProps from '@/sharedProps';
import Effect from '../Effect';
import motionBlurFragmentShader from './motionBlur.frag';
import maxVelocityTilingFragmentShader from './maxVelocityTiling.frag';
import neighbourMaxVelocityFragmentShader from './neighbourMaxVelocity.frag';
import Framebuffer from '@core/Framebuffer';
import Vector2 from '@math/Vector2';
import { TYPE } from '@core/constants';
import mathUtils from '../../../utils/mathUtils';

// Based on:
// https://github.com/0beqz/realism-effects/tree/main/src/motion-blur
// https://aminaliari.github.io/posts/motionblur/
export default class MotionBlur extends Effect {
	name = 'MotionBlur';
	intensity = 1;
	velocityScale = 4;
	samples = 20;
	tileSize = 20;
	jitter = 0.5;
	velocityTextureSize = new Vector2();

	constructor(options = {}) {
		super(options);

		this.tiledVelocityFrameBuffer = new Framebuffer({
			type: TYPE.RG16F,
		});
		this.neighbourMaxVelocityFrameBuffer = this.tiledVelocityFrameBuffer.clone();

		this.maxVelocityTilingProgram = new Program({
			isRaw: true,
			uniforms: Object.assign({
				u_velocityTexture: { value: null },
				u_tileSize: { value: this.tileSize },
			}),
			frag: maxVelocityTilingFragmentShader,
		});

		this.neighbourMaxVelocityProgram = new Program({
			isRaw: true,
			uniforms: Object.assign({
				u_tiledVelocityTexture: { value: null },
				u_textureSize: { value: this.velocityTextureSize },
			}),
			frag: neighbourMaxVelocityFragmentShader,
		});

		this.program = new Program({
			isRaw: true,
			uniforms: Object.assign(
				{
					u_inputTexture: { value: null },
					u_neighborTexture: { value: null },
					u_velocityTexture: { value: null },
					u_depthTexture: gBufferPass.sharedUniforms.u_depthTexture,
					u_intensity: { value: this.intensity },
					u_velocityScale: { value: this.velocityScale },
					u_jitter: { value: this.jitter },
					u_deltaTime: { value: 0 },
					u_tiledTextureSize: { value: this.velocityTextureSize },
					u_cameraFar: { value: 0 },
					u_cameraNear: { value: 1 },
					u_resolution: sharedProps.sharedUniforms.u_resolution,
				},
				sharedProps.blueNoiseSharedUniforms,
			),
			frag: motionBlurFragmentShader,
			defines: {
				SAMPLES: this.samples.toFixed(0),
			},
		});
	}

	update(dt, resolution) {
		this.program.uniforms.u_deltaTime.value = dt;
		this.intensity = mathUtils.fit(dt, 1 / 120, 1 / 30, 1, 0.25);

		const velocityTexture = gBufferPass.sharedUniforms.u_velocityTexture.value;
		const velocityTextureWidth = velocityTexture.width;
		const velocityTextureHeight = velocityTexture.height;
		const tiledWidth = Math.ceil(velocityTextureWidth / this.tileSize);
		const tiledHeight = Math.ceil(velocityTextureHeight / this.tileSize);

		this.velocityTextureSize.set(tiledWidth, tiledHeight);
		this.tiledVelocityFrameBuffer.resize(tiledWidth, tiledHeight);
		this.neighbourMaxVelocityFrameBuffer.resize(tiledWidth, tiledHeight);
	}

	render(inputTexture, outputFramebuffer) {
		super.render(inputTexture, outputFramebuffer);

		const velocityTexture = gBufferPass.sharedUniforms.u_velocityTexture.value;

		this.maxVelocityTilingProgram.uniforms.u_velocityTexture.value = velocityTexture;
		glUtils.renderProgram(this.maxVelocityTilingProgram, this.tiledVelocityFrameBuffer);

		this.neighbourMaxVelocityProgram.uniforms.u_tiledVelocityTexture.value = this.tiledVelocityFrameBuffer.textures[0];
		glUtils.renderProgram(this.neighbourMaxVelocityProgram, this.neighbourMaxVelocityFrameBuffer);

		this.program.uniforms.u_intensity.value = this.intensity;
		this.program.uniforms.u_velocityTexture.value = velocityTexture;
		this.program.uniforms.u_inputTexture.value = inputTexture;
		this.program.uniforms.u_neighborTexture.value = this.neighbourMaxVelocityFrameBuffer.textures[0];
		this.program.uniforms.u_cameraFar.value = sharedProps.camera.far;
		this.program.uniforms.u_cameraNear.value = sharedProps.camera.near;
		glUtils.renderProgram(this.program, outputFramebuffer);
	}
}
