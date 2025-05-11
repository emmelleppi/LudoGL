import Object3D from '@core/Object3D';
import Matrix4 from '@math/Matrix4';
import Vector3 from '@math/Vector3';

const tempVec3a = new Vector3();
const tempVec3b = new Vector3();

export default class Camera extends Object3D {
	constructor() {
		super();

		this.type = 'Camera';

		// Not the best way to do this, but it's a quick fix
		this.isJittered = false;

		this.matrixWorldInverse = new Matrix4();
		this.projectionMatrix = new Matrix4();
		this.projectionMatrixJittered = new Matrix4();
		this.projectionMatrixInverse = new Matrix4();
		this.viewProjectionMatrix = new Matrix4();

		// Initialize frustum planes as array of Vector3s
		this.frustum = Array(6)
			.fill()
			.map(() => new Vector3());
	}

	copy(source) {
		super.copy(source);

		this.matrixWorldInverse.copy(source.matrixWorldInverse);
		this.projectionMatrix.copy(source.projectionMatrix);
		this.projectionMatrixJittered.copy(source.projectionMatrixJittered);
		this.projectionMatrixInverse.copy(source.projectionMatrixInverse);
		this.viewProjectionMatrix.copy(source.viewProjectionMatrix);

		return this;
	}

	getWorldDirection(target) {
		this.updateMatrixWorld(true);
		const e = this.matrixWorld;
		target.set(-e[8], -e[9], -e[10]).normalize();
		return target;
	}

	updateMatrixWorld(force) {
		super.updateMatrixWorld(force);
		this.matrixWorldInverse.getInverse(this.matrixWorld);

		this.viewProjectionMatrix.multiplyMatrices(this.projectionMatrix, this.matrixWorldInverse);

		this.updateFrustum();
	}

	updateFrustum() {
		const m = this.projectionMatrix;

		// Extract frustum planes from projection matrix
		const plane0 = this.frustum[0].set(m[3] - m[0], m[7] - m[4], m[11] - m[8]);
		plane0.constant = m[15] - m[12]; // -x

		const plane1 = this.frustum[1].set(m[3] + m[0], m[7] + m[4], m[11] + m[8]);
		plane1.constant = m[15] + m[12]; // +x

		const plane2 = this.frustum[2].set(m[3] + m[1], m[7] + m[5], m[11] + m[9]);
		plane2.constant = m[15] + m[13]; // +y

		const plane3 = this.frustum[3].set(m[3] - m[1], m[7] - m[5], m[11] - m[9]);
		plane3.constant = m[15] - m[13]; // -y

		const plane4 = this.frustum[4].set(m[3] - m[2], m[7] - m[6], m[11] - m[10]);
		plane4.constant = m[15] - m[14]; // +z (far)

		const plane5 = this.frustum[5].set(m[3] + m[2], m[7] + m[6], m[11] + m[10]);
		plane5.constant = m[15] + m[14]; // -z (near)

		// Normalize planes
		for (let i = 0; i < 6; i++) {
			const invLen = 1.0 / this.frustum[i]._length();
			this.frustum[i].multiplyScalar(invLen);
			this.frustum[i].constant *= invLen;
		}
	}

	frustumIntersectsMesh(mesh) {
		// If no position attribute, treat as frustumCulled false
		if (!mesh.geometry.attributes.position) return true;

		// Compute bounding sphere if needed
		if (!mesh.geometry.bounds || mesh.geometry.bounds.radius === Infinity) {
			mesh.geometry.computeBoundingSphere();
		}

		if (!mesh.geometry.bounds) return true;

		const center = tempVec3a;
		center.copy(mesh.geometry.bounds.center);
		center.applyMatrix4(mesh.matrixWorld);

		const radius = mesh.geometry.bounds.radius * mesh.matrixWorld.getMaxScaleOnAxis();

		return this.frustumIntersectsSphere(center, radius);
	}

	frustumIntersectsSphere(center, radius) {
		const normal = tempVec3b;

		for (let i = 0; i < 6; i++) {
			const plane = this.frustum[i];
			const distance = normal.copy(plane).dot(center) + plane.constant;
			if (distance < -radius) return false;
		}
		return true;
	}

	lookAt(target) {
		super.lookAt(target, true);
		return this;
	}
}
