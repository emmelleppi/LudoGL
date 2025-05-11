import sharedProps from '../../sharedProps';

export default class Effect {
	name = '';
	program = null;
	enabled = true;
	needsSwap = true;

	#renderTimes = new Array(100).fill(0);
	#renderTimeIndex = 0;
	#renderSum = 0;
	#renderStartTime = 0;

	constructor(options = {}) {
		if (sharedProps.debug) {
			this.debugElement = document.getElementById('debug');
			this.debugDiv = document.createElement('div');
			this.debugDiv.style.color = 'white';
			this.debugDiv.style.padding = '4px';
			this.debugElement.appendChild(this.debugDiv);
		}
	}

	isEnabled() {
		return this.enabled;
	}

	update(dt, resolution) {}

	render(inputTexture, outputFramebuffer) {
		if (sharedProps.debug) {
			this.#renderStartTime = performance.now();
		}
	}

	postRender(dt, resolution) {
		if (!sharedProps.debug) return;

		const endTime = performance.now();
		const renderTime = endTime - this.#renderStartTime;

		this.#renderSum = this.#renderSum - this.#renderTimes[this.#renderTimeIndex] + renderTime;
		this.#renderTimes[this.#renderTimeIndex] = renderTime;
		this.#renderTimeIndex = (this.#renderTimeIndex + 1) % this.#renderTimes.length;

		const avgRenderTime = this.#renderSum / this.#renderTimes.length;
		this.debugDiv.textContent = `${this.name}: ${avgRenderTime.toFixed(3)} ms`;
	}
}
