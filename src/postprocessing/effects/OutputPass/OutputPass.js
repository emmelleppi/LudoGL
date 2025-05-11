import { FILTER, TYPE } from '@core/constants';
import Framebuffer from '@core/Framebuffer';
import glUtils from '@core/glUtils';
import Program from '@core/Program';
import sharedProps from '@/sharedProps';
import Effect from '../Effect';
import outputFragmentShader from './output.frag';

// Barrel lens distortion
// Sharpening
// Vignette
// Tonemapping
// Color correction
// Converts from R11F_G11F_B10F to RGBA UNSIGNED_BYTE (not used atm, just decomment the last 2 lines to see the render)
export default class OutputPass extends Effect {
	name = 'OutputPass';
	constructor(options = {}) {
		super(options);

		this.frameBuffer = new Framebuffer({
			type: TYPE.UNSIGNED_BYTE,
			filter: FILTER.LINEAR,
		});

		this.program = new Program({
			isRaw: true,
			uniforms: Object.assign(
				{
					u_inputTexture: { value: null },
					u_resolution: sharedProps.sharedUniforms.u_resolution,
				},
				sharedProps.blueNoiseSharedUniforms,
			),
			frag: outputFragmentShader,
		});
	}

	update(dt) {
		super.update(dt);
	}

	render(inputTexture, outputFramebuffer) {
		super.render(inputTexture, outputFramebuffer);

		this.frameBuffer.resize(outputFramebuffer.width, outputFramebuffer.height);

		this.program.uniforms.u_inputTexture.value = inputTexture;
		glUtils.renderProgram(this.program, null);
		// glUtils.renderProgram(this.program, this.frameBuffer);
		// glUtils.renderToScreen(this.frameBuffer.texture);
	}
}
