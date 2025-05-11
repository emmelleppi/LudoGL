import sharedProps from '@/sharedProps';

export default class TextureCube {
	constructor(size = null) {
		this.size = size;
		this.width = size;
		this.height = size;
		this.texture = null;
		this.create();
	}

	create() {
		const gl = sharedProps.gl;
		this.texture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);

		for (let i = 0; i < 6; i++) {
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA16F, this.size, this.size, 0, gl.RGBA, gl.FLOAT, null);
		}

		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		// gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
	}

	dispose() {
		if (this.texture) {
			sharedProps.gl.deleteTexture(this.texture);
			this.texture = null;
		}
	}
}
