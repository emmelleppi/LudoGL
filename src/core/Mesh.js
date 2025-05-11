import Object3D from '@core/Object3D';
import Matrix3 from '@math/Matrix3';
import Matrix4 from '@math/Matrix4';
import sharedProps from '@/sharedProps';
import SphereGeometry from '@geometries/SphereGeometry';
import glUtils from '@core/glUtils';

export default class Mesh extends Object3D {
	constructor(geometry, program) {
		super();

		this.type = 'Mesh';

		this.geometry = geometry;
		this.program = program;

		this._normalMatrix = new Matrix3();
		this.normalMatrix = new Matrix3();

		this.prevModelMatrix = new Matrix4();
		this.prevViewProjectionMatrix = new Matrix4();
		this.viewProjectionMatrix = new Matrix4();

		this.frustumCulled = false;
	}

	updateMatrixWorld(force) {
		super.updateMatrixWorld(force);

		// Update normal matrix
		this._normalMatrix.fromMatrix4(this.matrixWorld);
		this._normalMatrix.inverse();
		this._normalMatrix.transpose();
	}

	clone() {
		const mesh = new Mesh(this.geometry.clone(), this.program.clone());
		return mesh;
	}

	dispose() {
		this.geometry.dispose();
		this.program.dispose();
	}

	updatePreviousMatrices() {
		if (this.program.isRaw) {
			return;
		}

		this.prevModelMatrix.copy(this.matrix);
		this.prevViewProjectionMatrix.copy(this.viewProjectionMatrix);
	}

	updateUniformMatrices(camera) {
		if (this.program.isRaw) {
			return;
		}

		this.program.uniforms.prevModelMatrix.value.copy(this.prevModelMatrix);
		this.program.uniforms.prevViewProjectionMatrix.value.copy(this.prevViewProjectionMatrix);

		// Model view matrix should be model * view (inverse of camera world matrix)
		this.matrixWorld.multiplyMatrices(camera.matrixWorldInverse, this.matrixWorld);

		// Normal matrix should be derived from model view matrix
		this.normalMatrix.fromMatrix4(this.matrixWorld);
		this.normalMatrix.transpose();
		this.normalMatrix.inverse();

		// Update uniforms with correct matrices
		this.program.uniforms.modelViewMatrix.value.copy(this.matrixWorld);
		this.program.uniforms.normalMatrix.value.copy(this.normalMatrix);
		this.program.uniforms.modelMatrix.value.copy(this.matrix);
		this.program.uniforms.viewMatrix.value.copy(camera.matrixWorldInverse);
		this.program.uniforms.projectionMatrix.value.copy(camera.projectionMatrix);

		this.viewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
		this.program.uniforms.viewProjectionMatrix.value.copy(this.viewProjectionMatrix);

		this.program.uniforms.viewProjectionMatrixJittered.value.multiplyMatrices(camera.projectionMatrixJittered, camera.matrixWorldInverse);

		this.program.uniforms.cameraPosition.value.copy(camera.position);
		this.program.uniforms.cameraNear.value = camera.near;
		this.program.uniforms.cameraFar.value = camera.far;
	}

	draw(camera) {
		this.updateMatrixWorld();

		if (this.frustumCulled && camera) {
			if (!camera.frustumIntersectsMesh(this)) {
				return;
			}
		}

		this.updateUniformMatrices(camera);

		this.program.use();
		this.geometry.draw(this.program);

		if (camera.isJittered) {
			this.updatePreviousMatrices();
		}
	}
}
