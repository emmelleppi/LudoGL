import glUtils from '@core/glUtils';
import Program from '@core/Program';
import sharedProps from '@/sharedProps';
import Effect from '../Effect';
import Vector2 from '@/math/Vector2';
import taaFragmentShader from './TAA.frag';
import gBufferPass from '@gBufferPass/gBufferPass';

// Halton sequence for jittering
function createHaltonSequence(index, base) {
	let f = 1;
	let r = 0;
	let current = index;

	do {
		f = f / base;
		r = r + f * (current % base);
		current = Math.floor(current / base);
	} while (current > 0);

	return r;
}

const HALTON_SEQUENCE = Array.from({ length: 128 }, (_, i) => ({
	x: createHaltonSequence(i + 1, 2),
	y: createHaltonSequence(i + 1, 3),
}));

// TAA - Temporal Anti-Aliasing
// based on
// https://sugulee.wordpress.com/2021/06/21/temporal-anti-aliasingtaa-tutorial/
// https://ziyadbarakat.wordpress.com/2020/07/28/temporal-anti-aliasing-step-by-step/
// https://www.elopezr.com/temporal-aa-and-the-quest-for-the-holy-trail/
export default class TAA extends Effect {
	name = 'TAA';
	currentJitterIndex = 0;
	jitterOffset = new Vector2();

	sharedUniforms = {
		u_jitterOffset: { value: new Vector2() },
	};

	hystoryFbo = null;

	constructor(options = {}) {
		super(options);

		this.program = new Program({
			isRaw: true,
			uniforms: {
				u_inputTexture: { value: null },
				u_historyTexture: { value: null },
				u_resolution: sharedProps.sharedUniforms.u_resolution,
				u_velocityTexture: gBufferPass.sharedUniforms.u_velocityTexture,
				u_historyWeight: { value: 0.9 },
			},
			frag: taaFragmentShader,
		});

		this.updateJitterOffset(sharedProps.resolution);
	}

	updateJitterOffset(resolution) {
		if (resolution.x === 0 || resolution.y === 0) {
			return;
		}
		const jitter = HALTON_SEQUENCE[this.currentJitterIndex % HALTON_SEQUENCE.length];

		this.jitterOffset.x = ((jitter.x - 0.5) / resolution.x) * 2;
		this.jitterOffset.y = ((jitter.y - 0.5) / resolution.y) * 2;
		this.sharedUniforms.u_jitterOffset.value.copy(this.jitterOffset);
	}

	update(dt, resolution) {
		super.update(dt);

		if (this.hystoryFbo) {
			this.hystoryFbo.resize(resolution.x, resolution.y);
		}
	}

	render(inputTexture, outputFramebuffer) {
		super.render(inputTexture, outputFramebuffer);

		if (!this.hystoryFbo) {
			this.hystoryFbo = outputFramebuffer.clone();
			this.hystoryFbo.resize(sharedProps.resolution.x, sharedProps.resolution.y);
		}

		this.program.uniforms.u_inputTexture.value = inputTexture;
		this.program.uniforms.u_historyTexture.value = this.hystoryFbo.texture;

		glUtils.renderProgram(this.program, outputFramebuffer);
		glUtils.copy(outputFramebuffer.texture, this.hystoryFbo);
	}

	postRender(dt, resolution) {
		super.postRender(dt, resolution);
		this.currentJitterIndex = (this.currentJitterIndex + 1) % HALTON_SEQUENCE.length;
		this.updateJitterOffset(resolution);
	}
}
