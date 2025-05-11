import sharedProps from './sharedProps.js';
import glUtils from '@core/glUtils';
import postProcessor from '@postprocessing/postProcessor';
import PerspectiveCamera from '@core/PerspectiveCamera';
import Vector3 from '@math/Vector3';
import { OrbitControls } from '@utils/OrbitControls';
import visuals from '@visuals/visuals';
import Texture from '@core/Texture';
import { FILTER, WRAP } from '@core/constants';
import lightShadow from '@visuals/light/lightShadow';
import gBufferPass from '@/gBufferPass/gBufferPass';
import lightningPass from '@/lightningPass/lightningPass';
import envMapGenerator from './envMapGenerator/envMapGenerator';

class App {
	#renderTimes = new Array(60).fill(0);
	#renderTimeIndex = 0;
	#renderSum = 0;
	#renderStartTime = 0;
	#frameCount = 0;
	#elapsedTime = 0;

	constructor() {
		glUtils.init();
		this.preInit();
	}

	preInit() {
		if (sharedProps.debug) {
			this.debugElement = document.getElementById('debug');
			this.debugFpsDiv = document.createElement('div');
			this.debugFpsDiv.style.color = 'white';
			this.debugFpsDiv.style.padding = '4px';
			this.debugElement.appendChild(this.debugFpsDiv);
		}

		this.blueNoiseTexture = new Texture(null, 1, 1, {
			filter: FILTER.NEAREST,
			wrap: WRAP.REPEAT,
		});

		// https://github.com/Calinou/free-blue-noise-textures/tree/master
		this.blueNoiseTexture.loadImage('/bluenoise.png', () => {
			sharedProps.blueNoiseSharedUniforms.u_blueNoiseTexture.value = this.blueNoiseTexture;
			sharedProps.blueNoiseSharedUniforms.u_blueNoiseSize.value.set(this.blueNoiseTexture.width, this.blueNoiseTexture.height);
		});

		gBufferPass.preInit();
		lightningPass.preInit();
		postProcessor.preInit();
		visuals.preInit();
		lightShadow.preInit();

		this.debugGBufferButton = document.getElementById('debugGBufferButton');
		this.debugGBufferButton.addEventListener('click', () => {
			sharedProps.debugGBuffer = !sharedProps.debugGBuffer;
		});

		this.init();
	}

	init() {
		sharedProps.camera = this.camera = new PerspectiveCamera(45, 1, 0.01, 18);
		// Not the best way to do this, but it's a quick fix
		// otherwise the velocity vectors for TAA and Motion Blur are wrong
		this.camera.isJittered = true;
		this.camera.position.z = 5;
		this.camera.updateMatrixWorld();

		gBufferPass.init();
		lightningPass.init();
		postProcessor.init();
		visuals.init();
		lightShadow.init();
		envMapGenerator.init();

		this.controls = new OrbitControls(this.camera, {
			target: new Vector3(0, 0, 0),
		});

		window.addEventListener('resize', () => this.resize());
		this.resize();

		// Initialize last frame timestamp for delta calculation
		this._lastFrameTime = performance.now();
		this.loop();
	}

	resize(width, height) {
		const viewportWidth = width || window.innerWidth;
		const viewportHeight = height || window.innerHeight;

		let dprWidth = viewportWidth * sharedProps.DPR;
		let dprHeight = viewportHeight * sharedProps.DPR;

		if (dprWidth * dprHeight > sharedProps.maxPixelCount) {
			const aspect = dprWidth / dprHeight;
			dprHeight = Math.sqrt(sharedProps.maxPixelCount / aspect);
			dprWidth = Math.ceil(dprHeight * aspect);
			dprHeight = Math.ceil(dprHeight);
		}

		sharedProps.viewResolution.set(viewportWidth, viewportHeight);
		sharedProps.resolution.set(dprWidth, dprHeight);

		sharedProps.canvas.width = dprWidth;
		sharedProps.canvas.height = dprHeight;

		sharedProps.sharedUniforms.u_resolution.value.copy(sharedProps.resolution);
		sharedProps.sharedUniforms.u_viewResolution.value.copy(sharedProps.viewResolution);
		sharedProps.sharedUniforms.u_aspectRatio.value = dprWidth / dprHeight;

		this.camera.aspect = dprWidth / dprHeight;
		this.camera.updateProjectionMatrix();

		gBufferPass.resize(dprWidth, dprHeight);
		lightningPass.resize(dprWidth, dprHeight);
		postProcessor.resize(dprWidth, dprHeight);
		lightShadow.resize(dprWidth, dprHeight);
		visuals.resize(dprWidth, dprHeight);
	}

	loop() {
		requestAnimationFrame(this.loop.bind(this));

		if (!sharedProps.isReady) return;

		const now = performance.now();
		const deltaMs = now - this._lastFrameTime;

		if (deltaMs < sharedProps.fpsInterval && sharedProps.forceFPS) return;

		this._lastFrameTime = now;
		const deltaSec = deltaMs / 1000;

		// Debug start
		if (sharedProps.debug) {
			this.#renderStartTime = now;
			this.#elapsedTime += deltaMs;
			this.#frameCount++;
		}

		// Update time sharedProps in seconds
		sharedProps.deltaTime = deltaSec;
		sharedProps.dateTime = sharedProps.dateTime || 0;
		sharedProps.dateTime += deltaSec;
		sharedProps.time = sharedProps.time || 0;
		sharedProps.time += deltaSec;

		sharedProps.sharedUniforms.u_time.value = sharedProps.time;
		sharedProps.sharedUniforms.u_deltaTime.value = sharedProps.deltaTime;

		this.update(deltaSec);

		if (sharedProps.debug) {
			const renderEnd = performance.now();
			const renderTime = renderEnd - this.#renderStartTime;

			// Update circular buffer and running sum
			this.#renderSum = this.#renderSum - this.#renderTimes[this.#renderTimeIndex] + renderTime;
			this.#renderTimes[this.#renderTimeIndex] = renderTime;
			this.#renderTimeIndex = (this.#renderTimeIndex + 1) % this.#renderTimes.length;

			if (this.#elapsedTime >= 1000) {
				const fps = (this.#frameCount / this.#elapsedTime) * 1000;
				this.debugFpsDiv.textContent = `${fps.toFixed(1)} FPS`;
				this.#frameCount = 0;
				this.#elapsedTime = 0;
			}
		}
	}

	update(dt) {
		envMapGenerator.render();

		sharedProps.blueNoiseSharedUniforms.u_blueNoiseOffset.value.set(Math.random(), Math.random());

		this.controls.update();
		this.camera.updateMatrixWorld();

		// Apply TAA jitter to camera projection matrix
		const jitterOffset = postProcessor.taa.jitterOffset;
		this.camera.projectionMatrixJittered.copy(this.camera.projectionMatrix);
		this.camera.projectionMatrixJittered.applyJitter(jitterOffset.x, jitterOffset.y);

		lightShadow.update(dt);
		visuals.update(dt);

		visuals.drawDepth(lightShadow.shadowCamera, lightShadow.shadowBuffer);
		visuals.draw(this.camera, gBufferPass.frameBuffer);
		lightningPass.render(this.camera);
		postProcessor.render(this.camera);
	}
}

export default new App();
