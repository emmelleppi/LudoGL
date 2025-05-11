import glUtils from '@core/glUtils';
import sharedProps from '@/sharedProps';
import lightningPass from '@lightningPass/lightningPass';
import GTAOPass from './effects/GTAO/GTAO';
import TAA from './effects/TAA/TAA';
import FXAA from './effects/FXAA/FXAA';
import MotionBlur from './effects/MotionBlur/MotionBlur';
import Bloom from './effects/Bloom/Bloom';
import OutputPass from './effects/OutputPass/OutputPass';
import LUT3D from './effects/LUT3D/LUT3D';
import SSR from './effects/SSR/SSR';
import gBufferPass from '../gBufferPass/gBufferPass';
import TransparentForward from './effects/TransparentForward/TransparentForward';
import envMapGenerator from '../envMapGenerator/envMapGenerator';
class PostProcessor {
	effects = [];

	constructor() {}

	preInit() {}

	init() {
		this.fromPostprocessingRt = lightningPass.frameBuffer.clone();
		this.toPostprocessingRt = lightningPass.frameBuffer.clone();

		this.taa = new TAA();
		this.fxaa = new FXAA();
		this.gtao = new GTAOPass();
		this.transparentForward = new TransparentForward();
		this.ssr = new SSR();
		this.motionBlur = new MotionBlur();
		this.bloom = new Bloom();
		this.lut3D = new LUT3D();
		this.outputPass = new OutputPass();

		this.addEffect(this.taa);
		this.addEffect(this.fxaa);
		this.addEffect(this.gtao);
		this.addEffect(this.transparentForward);
		this.addEffect(this.ssr);
		this.addEffect(this.motionBlur);
		this.addEffect(this.bloom);
		this.addEffect(this.lut3D);
		this.addEffect(this.outputPass);

		document.getElementById('gtaoCheckbox').addEventListener('change', () => {
			this.gtao.enabled = document.getElementById('gtaoCheckbox').checked;
		});
		document.getElementById('ssrCheckbox').addEventListener('change', () => {
			this.ssr.enabled = document.getElementById('ssrCheckbox').checked;
		});
		document.getElementById('motionBlurCheckbox').addEventListener('change', () => {
			this.motionBlur.enabled = document.getElementById('motionBlurCheckbox').checked;
		});
		document.getElementById('bloomCheckbox').addEventListener('change', () => {
			this.bloom.enabled = document.getElementById('bloomCheckbox').checked;
		});
		document.getElementById('lutCheckbox').addEventListener('change', () => {
			this.lut3D.enabled = document.getElementById('lutCheckbox').checked;
		});
		document.getElementById('semiTransparentCheckbox').addEventListener('change', () => {
			this.transparentForward.enabled = document.getElementById('semiTransparentCheckbox').checked;
		});
	}

	addEffect(effect) {
		this.effects.push(effect);
	}

	resize() {
		this.fromPostprocessingRt.resize(sharedProps.resolution.x, sharedProps.resolution.y);
		this.toPostprocessingRt.resize(sharedProps.resolution.x, sharedProps.resolution.y);
	}

	render() {
		if (this.effects.length === 0) {
			glUtils.renderToScreen(this.lightingRt.texture);
			return;
		}

		let fromRt = this.fromPostprocessingRt;
		let toRt = this.toPostprocessingRt;

		for (let i = 0; i < this.effects.length; i++) {
			const effect = this.effects[i];

			if (!effect.isEnabled()) continue;

			if (effect.needsSwap) {
				[fromRt, toRt] = [toRt, fromRt];
			}

			let sceneTexture = i === 0 ? lightningPass.frameBuffer.texture : fromRt.texture;

			effect.update(sharedProps.deltaTime, sharedProps.resolution);
			effect.render(sceneTexture, toRt);
			effect.postRender(sharedProps.deltaTime, sharedProps.resolution);
		}

		// glUtils.debugDepthBuffer(gBufferPass.frameBuffer.depthTexture, 600, 0, 0, sharedProps.camera.near, sharedProps.camera.far);
		// glUtils.debugColor(transparentForward.frameBuffer.textures[0], 600, 0, 0);
		// glUtils.debugCube(envMapGenerator.sharedUniforms.u_diffuseEnvMap.value, 600, 0, 0);
		// glUtils.debugCube(envMapGenerator.sharedUniforms.u_specularEnvMap.value, 600, 0, 0);

		gBufferPass.debug();
	}
}

export default new PostProcessor();
