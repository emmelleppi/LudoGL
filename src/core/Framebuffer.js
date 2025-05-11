import Texture from '@core/Texture';
import { FILTER, TYPE, WRAP } from '@core/constants';
import sharedProps from '@/sharedProps';
import { DEPTH_TYPE } from './constants';
import TextureCube from './TextureCube';

export default class Framebuffer {
	constructor(opts = {}) {
		const { width = 1, height = 1, depth = false, isCube = false, depthType = DEPTH_TYPE.DEPTH_COMPONENT24, targets, filter = FILTER.NEAREST, wrap = WRAP.CLAMP_TO_EDGE, type = TYPE.UNSIGNED_BYTE, colorWrite = true } = opts;

		this.width = -1;
		this.height = -1;

		this.depth = depth;
		this.depthTexture = null;
		this.depthType = depthType;
		this.colorWrite = colorWrite;

		if (isCube) {
			this.textures = [new TextureCube(width)];
			this.numTargets = 1;
		} else {
			if (this.colorWrite) {
				// If targets not provided, create single target with direct filter/wrap/type
				if (!targets || targets.length === 0) {
					this.targets = [
						{
							filter,
							wrap,
							type,
						},
					];
				} else {
					this.targets = targets;
				}
				this.numTargets = this.targets.length;
			} else {
				this.targets = [];
				this.numTargets = 0;
			}

			// Create array of textures for multiple render targets
			this.textures = [];
			for (let i = 0; i < this.numTargets; i++) {
				const target = this.targets[i];
				this.textures.push(
					new Texture(null, width, height, {
						filter: target.filter,
						wrap: target.wrap,
						type: target.type,
						generateMipmaps: false,
					}),
				);
			}
		}
		this.texture = this.numTargets > 0 ? this.textures[0] : null;

		if (this.depth) {
			this.depthTexture = new Texture(null, width, height, {
				filter: FILTER.NEAREST,
				wrap: WRAP.CLAMP_TO_EDGE,
				type: this.depthType,
				generateMipmaps: false,
			});
		}
		this.resize(width, height, true);
	}

	resize(width, height, forceUpdate = false) {
		const gl = sharedProps.gl;

		if (this.width === width && this.height === height && !forceUpdate) {
			return;
		}

		this.width = width;
		this.height = height;

		if (!this.buffer) {
			this.buffer = gl.createFramebuffer();
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);

		if (this.colorWrite) {
			// Update all textures
			this.textures.forEach((texture) => {
				texture.width = width;
				texture.height = height;
				texture.dispose();
				texture.create();
			});

			// Attach all textures to the framebuffer
			const drawBuffers = [];
			for (let i = 0; i < this.numTargets; i++) {
				const attachment = gl.COLOR_ATTACHMENT0 + i;
				if (this.textures[i] instanceof TextureCube) {
					for (let j = 0; j < 6; j++) {
						gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_CUBE_MAP_POSITIVE_X + j, this.textures[i].texture, 0);
					}
				} else {
					gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, this.textures[i].texture, 0);
				}
				drawBuffers.push(attachment);
			}

			gl.drawBuffers(drawBuffers);
		} else {
			gl.drawBuffers([gl.NONE]);
			gl.readBuffer(gl.NONE);
		}

		if (this.depth) {
			this.depthTexture.width = width;
			this.depthTexture.height = height;
			this.depthTexture.dispose();
			this.depthTexture.create();

			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture.texture, 0);
		}

		const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
		if (status !== gl.FRAMEBUFFER_COMPLETE) {
			console.error('Framebuffer not complete:', status);
		}
	}

	clone() {
		const clone = new Framebuffer({
			width: this.width,
			height: this.height,
			targets: this.targets,
			depth: this.depth,
			depthType: this.depthType,
		});

		return clone;
	}

	dispose() {
		const gl = sharedProps.gl;
		this.textures.forEach((texture) => texture.dispose());
		if (this.depthBuffer) {
			gl.deleteRenderbuffer(this.depthBuffer);
		}
		gl.deleteFramebuffer(this.buffer);
	}
}
