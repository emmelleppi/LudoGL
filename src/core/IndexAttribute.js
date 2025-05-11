import { DRAW } from '@core/constants';
import sharedProps from '@/sharedProps';

export default class IndexAttribute {
	constructor(array, usage = DRAW.STATIC_DRAW) {
		let gl = sharedProps.gl;
		this.value = array;
		this.itemSize = 1;
		this.buffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, array, usage);
	}

	dispose() {
		let gl = sharedProps.gl;
		gl.deleteBuffer(this.buffer);
	}
}
