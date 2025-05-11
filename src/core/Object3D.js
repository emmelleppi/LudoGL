import Matrix4 from '@/math/Matrix4';
import Vector3 from '@/math/Vector3';
import Quaternion from '@/math/Quaternion';
import Euler from '@/math/Euler';

export default class Object3D {
	constructor() {
		this.uuid = Math.random().toString(36).substring(2, 9);
		this.name = '';
		this.type = 'Object3D';
		this.isObject3D = true;

		this.parent = null;
		this.children = [];

		this.position = new Vector3();
		this.rotation = new Euler();
		this.quaternion = new Quaternion();
		this.scale = new Vector3(1, 1, 1);
		this.up = new Vector3(0, 1, 0);

		this.rotation._target.onChange = () => this.quaternion.fromEuler(this.rotation, true);
		this.quaternion._target.onChange = () => this.rotation.fromQuaternion(this.quaternion, undefined, true);

		this.matrix = new Matrix4();
		this.matrixWorld = new Matrix4();
		this.matrixWorldNeedsUpdate = false;
		this.matrixAutoUpdate = true;

		this.visible = true;
	}

	add(object) {
		if (arguments.length > 1) {
			for (let i = 0; i < arguments.length; i++) {
				this.add(arguments[i]);
			}
			return this;
		}

		if (object === this) {
			console.error("Object3D.add: object can't be added as a child of itself.", object);
			return this;
		}

		if (object && object.isObject3D) {
			if (object.parent !== null) {
				object.parent.remove(object);
			}
			object.parent = this;
			this.children.push(object);
		} else {
			console.error('Object3D.add: object not an instance of Object3D.', object);
		}

		return this;
	}

	remove(object) {
		if (arguments.length > 1) {
			for (let i = 0; i < arguments.length; i++) {
				this.remove(arguments[i]);
			}
			return this;
		}

		const index = this.children.indexOf(object);
		if (index !== -1) {
			object.parent = null;
			this.children.splice(index, 1);
		}

		return this;
	}

	updateMatrix() {
		this.quaternion.fromEuler(this.rotation);
		this.matrix.compose(this.position, this.quaternion, this.scale);
		this.matrixWorldNeedsUpdate = true;
	}

	updateMatrixWorld(force) {
		if (this.matrixAutoUpdate) {
			this.updateMatrix();
		}

		if (this.matrixWorldNeedsUpdate || force) {
			if (this.parent === null) {
				this.matrixWorld.copy(this.matrix);
			} else {
				this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
			}

			this.matrixWorldNeedsUpdate = false;
			force = true;
		}

		for (let i = 0, l = this.children.length; i < l; i++) {
			this.children[i].updateMatrixWorld(force);
		}
	}

	traverse(callback) {
		callback(this);
		for (let i = 0, l = this.children.length; i < l; i++) {
			this.children[i].traverse(callback);
		}
	}

	lookAt(target, invert = false) {
		if (invert) this.matrix.lookAt(this.position, target, this.up);
		else this.matrix.lookAt(target, this.position, this.up);
		this.matrix.getRotation(this.quaternion._target);
		this.rotation.fromQuaternion(this.quaternion);
	}

	dispose() {}
}
