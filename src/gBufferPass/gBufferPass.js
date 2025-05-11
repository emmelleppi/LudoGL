import { TYPE } from '@core/constants';
import Framebuffer from '@core/Framebuffer';
import glUtils from '@core/glUtils';
import sharedProps from '@/sharedProps';
import lightShadow from '@visuals/light/lightShadow';

class GBufferPass {
	sharedUniforms = {
		u_albedoMetallic: { value: null },
		u_normalRoughShadowBloom: { value: null },
		u_emissiveAO: { value: null },
		u_velocityTexture: { value: null },
		u_depthTexture: { value: null },
		u_depthTexture: { value: null },
	};

	constructor() {}

	preInit() {}

	init() {
		this.frameBuffer = new Framebuffer({
			depth: true,
			targets: [
				{ type: TYPE.UNSIGNED_BYTE }, // Albedo + metalness (8x4 = 32 bits)
				{ type: TYPE.HALF_FLOAT }, // View Normal + roughness + shadow + bloom intensity (16x4 = 32 bits)
				{ type: TYPE.UNSIGNED_BYTE }, // Emissive + AO Baked (8x4 = 32 bits)
				{ type: TYPE.RG16F }, // TAA velocity (16x2 = 32 bits)
			],
		});

		this.sharedUniforms.u_albedoMetallic.value = this.frameBuffer.textures[0];
		this.sharedUniforms.u_normalRoughShadowBloom.value = this.frameBuffer.textures[1];
		this.sharedUniforms.u_emissiveAO.value = this.frameBuffer.textures[2];
		this.sharedUniforms.u_velocityTexture.value = this.frameBuffer.textures[3];
		this.sharedUniforms.u_depthTexture.value = this.frameBuffer.depthTexture;
	}

	resize(width, height) {
		this.frameBuffer.resize(width, height);
	}

	debug() {
		if (!this.debugContainer) {
			this.debugContainer = document.createElement('div');
			document.body.appendChild(this.debugContainer);
		}
		if (!this.debugTextures) {
			this.debugTextures = [...this.frameBuffer.textures, this.frameBuffer.depthTexture, lightShadow.shadowBuffer.depthTexture];
		}
		this.debugContainer.style.display = sharedProps.debugGBuffer ? 'block' : 'none';
		if (!sharedProps.debugGBuffer) {
			return;
		}

		let elementsPerColumn = 4;
		let borderSize = 4;
		let debugOffset = 0;
		let debugHeight = sharedProps.resolution.y / elementsPerColumn;
		const aspectRatio = this.debugTextures[0].width / this.debugTextures[0].height;
		const width = Math.floor(debugHeight * aspectRatio);
		let x = 0;

		for (let i = 0; i < this.debugTextures.length; i++) {
			if (debugOffset + debugHeight > sharedProps.resolution.y) {
				x = sharedProps.resolution.x - width;
				debugOffset = 0;
			}

			// Create or update debug div
			if (!this.debugDivs) {
				this.debugDivs = new Map();
			}

			const divKey = `debug-div-${i}`;
			let debugDiv = this.debugDivs.get(divKey);

			if (!debugDiv) {
				debugDiv = document.createElement('div');
				debugDiv.style.position = 'absolute';
				debugDiv.style.border = `${borderSize}px solid #222`;
				debugDiv.style.pointerEvents = 'none';
				debugDiv.style.display = 'block';

				const labels = ['Albedo (RGB) + Metallic (A)', 'Normal (RGB) + Roughness/Shadow/Bloom (A)', 'Emissive (RGB) + AO (A)', 'Velocity (RG)', 'Linear Depth', 'Shadow Map'];

				const label = document.createElement('div');
				label.style.color = 'white';
				label.style.fontSize = '12px';
				label.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
				label.style.padding = '2px';
				label.style.pointerEvents = 'none';
				label.textContent = labels[i];
				debugDiv.appendChild(label);

				this.debugContainer.appendChild(debugDiv);
				this.debugDivs.set(divKey, debugDiv);
			}
			debugDiv.style.left = x / sharedProps.DPR + 'px';
			debugDiv.style.top = debugOffset / sharedProps.DPR + 'px';
			debugDiv.style.width = width / sharedProps.DPR - borderSize + 'px';
			debugDiv.style.height = debugHeight / sharedProps.DPR - 0.5 * borderSize * elementsPerColumn + 'px';

			if (i === this.debugTextures.length - 2) {
				// Linear depth texture
				glUtils.debugDepthBuffer(this.debugTextures[i], debugHeight, x, debugOffset, sharedProps.camera.near, sharedProps.camera.far);
			} else if (i === this.debugTextures.length - 1) {
				// Shadow map
				glUtils.debugDepthBuffer(this.debugTextures[i], debugHeight, x, debugOffset, lightShadow.shadowCamera.near, lightShadow.shadowCamera.far);
			} else {
				glUtils.debugColor(this.debugTextures[i], debugHeight, x, debugOffset);
				if (this.debugTextures[i].type.channels === sharedProps.gl.RGBA) {
					// First 3 textures are RGBA
					glUtils.debugAlpha(this.debugTextures[i], debugHeight / 3, x + width - width / 3, debugOffset + debugHeight - debugHeight / 3);
				}
			}

			debugOffset += debugHeight;
		}
	}
}

export default new GBufferPass();
