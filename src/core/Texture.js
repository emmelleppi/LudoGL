import sharedProps from '@/sharedProps';
import { FILTER, WRAP, TYPE } from '@core/constants';

export default class Texture {
	static loadedImagesCount = 0;
	static imagesToLoad = 0;

	constructor(source = null, width = null, height = null, config = {}) {
		const { wrap = WRAP.CLAMP_TO_EDGE, filter = FILTER.NEAREST, anisotropy = 1, generateMipmaps = true, isSRGB = false, type = TYPE.UNSIGNED_BYTE } = config;

		this.source = source;
		this.width = width;
		this.height = height;
		this.texture = null;
		this._wrap = wrap;
		this._filter = filter;
		this.anisotropy = Math.min(sharedProps.maxAnisotropy, anisotropy);
		this.generateMipmaps = generateMipmaps;
		this.isImage = false;
		this.needsUpdate = false;
		this.type = type;
		this.isSRGB = isSRGB;

		if (source) {
			this.create();
		}
	}

	loadImage(url, cb) {
		Texture.imagesToLoad++;
		this.isImage = true;
		const img = new Image();
		img.addEventListener('load', () => {
			this.source = img;
			this.width = img.width;
			this.height = img.height;
			this.anisotropy = sharedProps.maxAnisotropy;
			this.create();
			cb?.();
			Texture.loadedImagesCount++;

			if (Texture.loadedImagesCount === Texture.imagesToLoad) {
				sharedProps.isReady = true;
			}
		});
		img.src = url;
	}

	create() {
		const gl = sharedProps.gl;
		this.texture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		if (this.isImage) {
			gl.texImage2D(gl.TEXTURE_2D, 0, this.isSRGB ? gl.SRGB8_ALPHA8 : gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.source);
		} else {
			gl.texImage2D(gl.TEXTURE_2D, 0, this.type.internalFormat, this.width, this.height, 0, this.type.channels, this.type.type, this.source);
		}

		this.updateFilter(true);
		this.updateWrap(true);

		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	updateWrap(skipBind = false) {
		if (!this.texture) return;

		const gl = sharedProps.gl;
		if (!skipBind) gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this._wrap.wrapS);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this._wrap.wrapT);
		if (!skipBind) gl.bindTexture(gl.TEXTURE_2D, null);
	}

	updateFilter(skipBind = false) {
		if (!this.texture) return;

		const gl = sharedProps.gl;

		if (!skipBind) gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this._filter.minFilter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this._filter.magFilter);
		if (this.generateMipmaps) {
			gl.generateMipmap(gl.TEXTURE_2D);
		}
		if (sharedProps.extAnisotropic) {
			gl.texParameterf(gl.TEXTURE_2D, sharedProps.extAnisotropic.TEXTURE_MAX_ANISOTROPY_EXT, this.anisotropy);
		}
		if (!skipBind) gl.bindTexture(gl.TEXTURE_2D, null);
	}

	set wrap(value) {
		this._wrap = value;
		this.updateWrap();
	}

	set filter(value) {
		this._filter = value;
		this.updateFilter();
	}

	dispose() {
		if (this.texture) {
			sharedProps.gl.deleteTexture(this.texture);
			this.texture = null;
		}
	}
}
