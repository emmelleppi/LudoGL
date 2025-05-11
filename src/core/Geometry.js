import Attribute from '@core/Attribute';
import InstancedAttribute from '@core/InstancedAttribute';
import IndexAttribute from '@core/IndexAttribute';
import sharedProps from '@/sharedProps';
import Vector3 from '@math/Vector3';

const tempVec3 = new Vector3();

export default class Geometry {
	constructor() {
		this.attributes = {};
		this.bounds = {
			center: new Vector3(),
			radius: Infinity,
		};
	}

	setAttribute(name, array, itemSize) {
		this.attributes[name] = new Attribute(array, itemSize);
		return this;
	}

	setIndex(array) {
		this.attributes['index'] = new IndexAttribute(array);
		return this;
	}

	setInstancedAttribute(name, array, itemSize) {
		this.attributes[name] = new InstancedAttribute(array, itemSize);
		return this;
	}

	dispose() {
		for (let name in this.attributes) {
			const attribute = this.attributes[name];
			attribute.dispose();
		}
	}

	clone() {
		const geometry = new Geometry();
		for (let name in this.attributes) {
			geometry.setAttribute(name, this.attributes[name].clone());
		}
		return geometry;
	}

	computeBoundingSphere(attr) {
		if (!attr) attr = this.attributes.position;
		if (!attr || !attr.value) {
			this.bounds.radius = Infinity;
			return;
		}

		const array = attr.value;
		const stride = attr.itemSize || 3;

		let maxRadiusSq = 0;
		for (let i = 0, l = array.length; i < l; i += stride) {
			tempVec3.fromArray(array, i);
			maxRadiusSq = Math.max(maxRadiusSq, this.bounds.center.squaredDistanceTo(tempVec3));
		}

		this.bounds.radius = isNaN(maxRadiusSq) ? Infinity : Math.sqrt(maxRadiusSq);

		// TODO: Remove this and use the BBOX
		// this.bounds.radius *= 4;
	}

	draw(program) {
		const gl = sharedProps.gl;

		// Set attributes
		let isInstanced = false;
		let instanceCount = Infinity;

		for (const id in program.glAttributes) {
			const attribute = this.attributes[id];
			const location = program.glAttributes[id].location;

			gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer);
			gl.enableVertexAttribArray(location);
			gl.vertexAttribPointer(location, attribute.itemSize, gl.FLOAT, false, 0, 0);

			if (attribute.isInstanced) {
				isInstanced = true;
				gl.vertexAttribDivisor(location, 1);
				instanceCount = Math.min(instanceCount, attribute.value.length / attribute.itemSize);
			} else {
				gl.vertexAttribDivisor(location, 0);
			}
		}

		const indexAttribute = this.attributes.index;
		if (indexAttribute) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexAttribute.buffer);

			const indexArray = indexAttribute.value;
			let dataType = gl.UNSIGNED_BYTE;
			if (indexArray instanceof Uint16Array) dataType = gl.UNSIGNED_SHORT;
			else if (indexArray instanceof Uint32Array) dataType = gl.UNSIGNED_INT;

			if (isInstanced) {
				gl.drawElementsInstanced(gl.TRIANGLES, indexAttribute.value.length, dataType, 0, instanceCount);
			} else {
				gl.drawElements(gl.TRIANGLES, indexAttribute.value.length, dataType, 0);
			}
		} else {
			if (isInstanced) {
				gl.drawArraysInstanced(gl.TRIANGLES, 0, this.attributes.position.value.length / this.attributes.position.itemSize, instanceCount);
			} else {
				gl.drawArrays(gl.TRIANGLES, 0, this.attributes.position.value.length / this.attributes.position.itemSize);
			}
		}
	}
}
