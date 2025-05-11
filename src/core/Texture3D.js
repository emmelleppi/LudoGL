import sharedProps from '@/sharedProps';
import { FILTER, WRAP } from '@core/constants';

export default class Texture3D {
	constructor(source = null, size = null, config = {}) {
		const { wrap = WRAP.CLAMP_TO_EDGE, filter = FILTER.NEAREST } = config;

		this.source = source;
		this.size = size;
		this.texture = null;
		this._wrap = wrap;
		this._filter = filter;

		this.create();
	}

	create() {
		const gl = sharedProps.gl;
		this.texture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_3D, this.texture);

		gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGB16F, this.size, this.size, this.size, 0, gl.RGB, gl.FLOAT, this.source);

		this.updateFilter(true);
		this.updateWrap(true);

		gl.bindTexture(gl.TEXTURE_3D, null);
	}

	updateWrap(skipBind = false) {
		if (!this.texture) return;

		const gl = sharedProps.gl;
		if (!skipBind) gl.bindTexture(gl.TEXTURE_3D, this.texture);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
		if (!skipBind) gl.bindTexture(gl.TEXTURE_3D, null);
	}

	updateFilter(skipBind = false) {
		if (!this.texture) return;

		const gl = sharedProps.gl;

		if (!skipBind) gl.bindTexture(gl.TEXTURE_3D, this.texture);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		if (!skipBind) gl.bindTexture(gl.TEXTURE_3D, null);
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
