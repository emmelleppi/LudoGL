import particlesPositionSim from './particlesPositionSim.frag';
import particlesVelocitySim from './particlesVelocitySim.frag';
import Framebuffer from '@core/Framebuffer';
import { TYPE } from '@core/constants';
import Texture from '@core/Texture';
import glUtils from '@core/glUtils';
import Program from '@core/Program';
import Vector2 from '@math/Vector2';
import sharedProps from '@/sharedProps';
class ParticlesSim {
	textureSize = new Vector2(0, 0);
	particleRowCount = sharedProps.isMobile ? 128 : 256;
	particleColumnCount = this.particleRowCount;
	particleCount = this.particleRowCount * this.particleColumnCount;

	currPositionLifeRenderTarget;
	prevPositionLifeRenderTarget;
	currVelocityLifeRenderTarget;
	prevVelocityLifeRenderTarget;

	positionLifes;
	velocityLifes;

	positionLifesDataTexture;
	velocityLifesDataTexture;

	sharedUniforms = {
		u_simTextureSize: { value: this.textureSize },

		u_defaultPositionLifeTexture: { value: null },
		u_defaultVelocityLifeTexture: { value: null },

		u_currPositionLifeTexture: { value: null },
		u_prevPositionLifeTexture: { value: null },

		u_currVelocityLifeTexture: { value: null },
		u_prevVelocityLifeTexture: { value: null },
	};

	isReady = false;

	preInit() {}

	init() {
		const simPixelWidth = Math.ceil(Math.sqrt(this.particleCount));
		const simPixelHeight = Math.ceil(this.particleCount / simPixelWidth);
		const simPixelCount = simPixelWidth * simPixelHeight;

		this.textureSize.set(simPixelWidth, simPixelHeight);

		this.positionLifes = new Float32Array(simPixelCount * 4);
		this.velocityLifes = new Float32Array(simPixelCount * 4);

		this.currPositionLifeRenderTarget = new Framebuffer({
			width: simPixelWidth,
			height: simPixelHeight,
			type: TYPE.FLOAT,
		});
		this.prevPositionLifeRenderTarget = this.currPositionLifeRenderTarget.clone();
		this.currVelocityLifeRenderTarget = this.currPositionLifeRenderTarget.clone();
		this.prevVelocityLifeRenderTarget = this.currPositionLifeRenderTarget.clone();

		for (let i = 0, i4 = 0; i < this.particleCount; i++, i4 += 4) {
			const u = Math.random();
			const v = Math.random();
			const theta = u * 2.0 * Math.PI;
			const phi = Math.acos(2.0 * v - 1.0);
			const r = Math.cbrt(Math.random()) * 0.3;
			const sinTheta = Math.sin(theta);
			const cosTheta = Math.cos(theta);
			const sinPhi = Math.sin(phi);
			const cosPhi = Math.cos(phi);

			this.positionLifes[i4] = r * sinPhi * cosTheta * 2.0;
			this.positionLifes[i4 + 1] = r * sinPhi * sinTheta * 2.0;
			this.positionLifes[i4 + 2] = r * cosPhi * 2;
			this.positionLifes[i4 + 3] = Math.random();

			this.velocityLifes[i4] = 0;
			this.velocityLifes[i4 + 1] = 0;
			this.velocityLifes[i4 + 2] = 0;
			this.velocityLifes[i4 + 3] = 1;
		}

		this.positionLifesDataTexture = new Texture(this.positionLifes, simPixelWidth, simPixelHeight, {
			type: TYPE.FLOAT,
			generateMipmaps: false,
		});
		this.velocityLifesDataTexture = new Texture(this.velocityLifes, simPixelWidth, simPixelHeight, {
			type: TYPE.FLOAT,
			generateMipmaps: false,
		});

		this.sharedUniforms.u_defaultPositionLifeTexture.value = this.positionLifesDataTexture;
		this.sharedUniforms.u_defaultVelocityLifeTexture.value = this.velocityLifesDataTexture;

		glUtils.copy(this.positionLifesDataTexture, this.currPositionLifeRenderTarget);
		glUtils.copy(this.velocityLifesDataTexture, this.currVelocityLifeRenderTarget);

		this.positionProgram = new Program({
			isRaw: true,
			isHighp: true,
			uniforms: {
				u_time: { value: 0 },
				u_deltaTime: { value: 0 },
				u_defaultPositionLifeTexture: this.sharedUniforms.u_defaultPositionLifeTexture,
				u_defaultVelocityLifeTexture: this.sharedUniforms.u_defaultVelocityLifeTexture,
				u_positionLifeTexture: this.sharedUniforms.u_prevPositionLifeTexture,
				u_velocityLifeTexture: this.sharedUniforms.u_currVelocityLifeTexture,
				u_textureSize: { value: this.textureSize },
			},
			frag: particlesPositionSim,
		});

		this.velocityProgram = new Program({
			isRaw: true,
			isHighp: true,
			uniforms: {
				u_time: { value: 0 },
				u_deltaTime: { value: 0 },
				u_defaultPositionLifeTexture: this.sharedUniforms.u_defaultPositionLifeTexture,
				u_defaultVelocityLifeTexture: this.sharedUniforms.u_defaultVelocityLifeTexture,
				u_velocityLifeTexture: this.sharedUniforms.u_prevVelocityLifeTexture,
				u_positionLifeTexture: this.sharedUniforms.u_prevPositionLifeTexture,
				u_timeScale: { value: 1.0 },
			},
			frag: particlesVelocitySim,
		});

		this.isReady = true;
	}

	resize(width, height) {}

	update(dt) {
		if (!this.isReady) return;

		const _dt = Math.min(1 / 40, Math.max(1 / 120, dt));

		const timeScale = 0.25 + 3.0 * (Math.sin(sharedProps.time * 0.25) * 0.5 + 0.5);
		const velocityDelta = timeScale * _dt;
		this.velocityProgram.uniforms.u_time.value += velocityDelta;
		this.velocityProgram.uniforms.u_deltaTime.value = velocityDelta;

		this.positionProgram.uniforms.u_time.value += _dt;
		this.positionProgram.uniforms.u_deltaTime.value = _dt;

		// swap
		const tmpVel = this.prevVelocityLifeRenderTarget;
		this.prevVelocityLifeRenderTarget = this.currVelocityLifeRenderTarget;
		this.currVelocityLifeRenderTarget = tmpVel;
		this.sharedUniforms.u_prevVelocityLifeTexture.value = this.prevVelocityLifeRenderTarget.texture;
		this.sharedUniforms.u_currVelocityLifeTexture.value = this.currVelocityLifeRenderTarget.texture;
		glUtils.renderProgram(this.velocityProgram, this.currVelocityLifeRenderTarget);

		const tmpPos = this.prevPositionLifeRenderTarget;
		this.prevPositionLifeRenderTarget = this.currPositionLifeRenderTarget;
		this.currPositionLifeRenderTarget = tmpPos;
		this.sharedUniforms.u_prevPositionLifeTexture.value = this.prevPositionLifeRenderTarget.texture;
		this.sharedUniforms.u_currPositionLifeTexture.value = this.currPositionLifeRenderTarget.texture;
		glUtils.renderProgram(this.positionProgram, this.currPositionLifeRenderTarget);
	}
}

export default new ParticlesSim();
