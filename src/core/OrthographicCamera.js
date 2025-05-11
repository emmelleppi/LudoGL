import Camera from '@core/Camera';

export default class OrthographicCamera extends Camera {
	constructor(left = -1, right = 1, top = 1, bottom = -1, near = 0.1, far = 2000, zoom = 1) {
		super();

		this.type = 'orthographic';

		this.zoom = zoom;
		this.left = left;
		this.right = right;
		this.top = top;
		this.bottom = bottom;
		this.near = near;
		this.far = far;
		this.updateProjectionMatrix();
	}

	updateProjectionMatrix() {
		const left = this.left / this.zoom;
		const right = this.right / this.zoom;
		const bottom = this.bottom / this.zoom;
		const top = this.top / this.zoom;

		const dx = (right - left) / 2;
		const dy = (top - bottom) / 2;
		const cx = (right + left) / 2;
		const cy = (top + bottom) / 2;

		this.projectionMatrix.makeOrthographic(cx - dx, cx + dx, cy + dy, cy - dy, this.near, this.far);
		this.projectionMatrixJittered.copy(this.projectionMatrix);
		this.projectionMatrixInverse.getInverse(this.projectionMatrix);
	}

	copy(source) {
		super.copy(source);

		this.left = source.left;
		this.right = source.right;
		this.top = source.top;
		this.bottom = source.bottom;
		this.near = source.near;
		this.far = source.far;

		return this;
	}
}
