import { DRAW } from '@core/constants';
import sharedProps from '@/sharedProps';

export default class Attribute {
	constructor(array, itemSize, usage = DRAW.STATIC_DRAW) {
		let gl = sharedProps.gl;
		this.value = array;
		this.itemSize = itemSize;
		this.buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
		gl.bufferData(gl.ARRAY_BUFFER, array, usage);
	}

	dispose() {
		let gl = sharedProps.gl;
		gl.deleteBuffer(this.buffer);
	}
}
