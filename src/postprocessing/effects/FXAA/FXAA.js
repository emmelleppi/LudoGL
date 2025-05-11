import glUtils from '@core/glUtils';
import Program from '@core/Program';
import sharedProps from '@/sharedProps';
import Effect from '../Effect';
import fxaaFragmentShader from './FXAA.frag';

// FXAA - Fast Approximate Anti-Aliasing
// based on https://github.com/mrdoob/three.js/blob/dev/examples/jsm/shaders/FXAAShader.js
export default class FXAA extends Effect {
	name = 'FXAA';
	constructor(options = {}) {
		super(options);

		this.program = new Program({
			isRaw: true,
			uniforms: {
				u_inputTexture: { value: null },
				u_resolution: sharedProps.sharedUniforms.u_resolution,
			},
			frag: fxaaFragmentShader,
		});
	}

	update(dt) {
		super.update(dt);
	}

	render(inputTexture, outputFramebuffer) {
		super.render(inputTexture, outputFramebuffer);

		this.program.uniforms.u_inputTexture.value = inputTexture;
		glUtils.renderProgram(this.program, outputFramebuffer);
	}
}
