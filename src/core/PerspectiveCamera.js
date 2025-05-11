import Camera from '@core/Camera';

export default class PerspectiveCamera extends Camera {
	constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
		super();

		this.type = 'PerspectiveCamera';

		this.fov = fov;
		this.aspect = aspect;
		this.near = near;
		this.far = far;
		this.zoom = 1;
		this.view = null;
		this.filmGauge = 35;
		this.filmOffset = 0;

		this.updateProjectionMatrix();
	}

	updateProjectionMatrix() {
		const near = this.near;
		let top = (near * Math.tan((Math.PI / 180) * 0.5 * this.fov)) / this.zoom;
		let height = 2 * top;
		let width = this.aspect * height;
		let left = -0.5 * width;
		const view = this.view;

		if (this.view !== null && this.view.enabled) {
			const fullWidth = view.fullWidth,
				fullHeight = view.fullHeight;

			left += (view.offsetX * width) / fullWidth;
			top -= (view.offsetY * height) / fullHeight;
			width *= view.width / fullWidth;
			height *= view.height / fullHeight;
		}

		const skew = this.filmOffset;
		if (skew !== 0) left += (near * skew) / this.getFilmWidth();

		this.projectionMatrix.makePerspective(left, left + width, top, top - height, near, this.far, this.coordinateSystem);
		this.projectionMatrixJittered.copy(this.projectionMatrix);
		this.projectionMatrixInverse.getInverse(this.projectionMatrix);
	}

	getFilmWidth() {
		// film not completely covered in portrait format (aspect < 1)
		return this.filmGauge * Math.min(this.aspect, 1);
	}

	copy(source) {
		super.copy(source);

		this.fov = source.fov;
		this.aspect = source.aspect;
		this.near = source.near;
		this.far = source.far;

		return this;
	}
}
