import glUtils from '@core/glUtils';
import Effect from '../Effect';
import visuals from '@visuals/visuals';
import sharedProps from '../../../sharedProps';
import Program from '@core/Program';
import blurFrag from '@glsl/blur.glsl';
import Vector2 from '@math/Vector2';

class TransparentForwardPass extends Effect {
	name = 'TransparentPass';
	frameBuffer = null;
	cacheLightBuffer = null;

	constructor() {
		super();

		this.needsSwap = false;
		this.resolution = new Vector2();
		this.blurProgram = new Program({
			isRaw: true,
			frag: blurFrag,
			uniforms: {
				u_texture: { value: null },
				u_delta: { value: new Vector2() },
			},
		});
	}

	update(dt, resolution) {
		super.update(dt, resolution);

		this.resolution.set(Math.floor(0.25 * resolution.x), Math.floor(0.25 * resolution.y));

		if (this.cacheLightBuffer) {
			this.cacheLightBuffer.resize(this.resolution.x, this.resolution.y);
			this.blurCacheFramebuffer.resize(this.resolution.x, this.resolution.y);
		}
	}

	render(inputTexture, outputFramebuffer) {
		// there is no swap for this effect, so outputFramebuffer is the one that will be used
		super.render(inputTexture, outputFramebuffer);

		if (!this.cacheLightBuffer) {
			this.cacheLightBuffer = outputFramebuffer.clone();
			this.blurCacheFramebuffer = outputFramebuffer.clone();
			this.update(0, sharedProps.resolution);
		}

		const blurRadius = 4;
		this.blurProgram.uniforms.u_delta.value.set(blurRadius / this.resolution.x, 0);
		this.blurProgram.uniforms.u_texture.value = outputFramebuffer.texture;
		glUtils.renderProgram(this.blurProgram, this.blurCacheFramebuffer);

		this.blurProgram.uniforms.u_delta.value.set(0, blurRadius / this.resolution.y);
		this.blurProgram.uniforms.u_texture.value = this.blurCacheFramebuffer.texture;
		glUtils.renderProgram(this.blurProgram, this.cacheLightBuffer);

		visuals.drawTransparency(sharedProps.camera, this.cacheLightBuffer.texture, outputFramebuffer);
	}

	postRender(dt, resolution) {
		super.postRender(dt, resolution);
	}
}

export default TransparentForwardPass;
