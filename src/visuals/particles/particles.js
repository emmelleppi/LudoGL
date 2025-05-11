import sharedProps from '@/sharedProps';
import particlesSim from './particlesSim';
import vert from './particles.vert';
import frag from './particles.frag';
import SphereGeometry from '@geometries/SphereGeometry';
import Program from '@core/Program';
import Mesh from '@core/Mesh';
import glUtils from '@core/glUtils';
import lightShadow from '@visuals/light/lightShadow';
import Color from '@math/Color';
import mathUtils from '../../utils/mathUtils';

class Particles {
	mesh;
	program;
	particleScale = (sharedProps.isMobile ? 1.5 : 1) * 0.015;
	metalness = 0.0;
	roughness = 0.0;

	isReady = false;

	preInit() {
		particlesSim.preInit();
	}

	init() {
		particlesSim.init();

		const simPixelWidth = particlesSim.textureSize.x;
		const simPixelHeight = particlesSim.textureSize.y;
		const particleCount = particlesSim.particleCount;

		const simUvs = new Float32Array(particleCount * 2);
		for (let i = 0, i2 = 0; i < particleCount; i++, i2 += 2) {
			simUvs[i2] = ((i % simPixelWidth) + 0.5) / simPixelWidth;
			simUvs[i2 + 1] = (Math.floor(i / simPixelWidth) + 0.5) / simPixelHeight;
		}

		const geometry = new SphereGeometry(1, 8);
		geometry.setInstancedAttribute('a_simUv', simUvs, 2);

		this.program = new Program({
			uniforms: Object.assign(
				{
					u_time: sharedProps.sharedUniforms.u_time,
					u_currPositionLifeTexture: particlesSim.sharedUniforms.u_currPositionLifeTexture,
					u_currVelocityLifeTexture: particlesSim.sharedUniforms.u_currVelocityLifeTexture,
					u_simTextureSize: { value: particlesSim.textureSize },
					u_color: { value: new Color() },
					u_emissiveColor: { value: new Color() },
					u_scale: { value: this.particleScale },
					u_metalness: { value: 0 },
					u_roughness: { value: 0 },
				},
				lightShadow.sharedUniforms,
				sharedProps.blueNoiseSharedUniforms,
			),
			defines: {
				MIN_ROUGHNESS: sharedProps.minRoughness,
			},
			vert,
			frag,
		});

		this.programDepth = new Program({
			uniforms: Object.assign({
				u_time: sharedProps.sharedUniforms.u_time,
				u_currPositionLifeTexture: particlesSim.sharedUniforms.u_currPositionLifeTexture,
				u_currVelocityLifeTexture: particlesSim.sharedUniforms.u_currVelocityLifeTexture,
				u_simTextureSize: { value: particlesSim.textureSize },
				u_scale: { value: this.particleScale },
			}),
			vert,
			frag: `void main() {}`,
			defines: {
				IS_DEPTH: true,
			},
		});

		this.mesh = new Mesh(geometry, this.program);
		this.mesh.frustumCulled = false;
		this.isReady = true;

		this.initGui();
	}

	initGui() {
		this.colorPicker = document.getElementById('colorPicker');
		this.colorPicker.addEventListener('input', (e) => {
			this.mesh.program.uniforms.u_color.value.setStyle(e.target.value);
		});
		this.mesh.program.uniforms.u_color.value.setStyle(this.colorPicker.value);

		this.emissiveColorPicker = document.getElementById('emissiveColorPicker');
		this.emissiveColorPicker.addEventListener('input', (e) => {
			this.mesh.program.uniforms.u_emissiveColor.value.setStyle(e.target.value);
		});
		this.mesh.program.uniforms.u_emissiveColor.value.setStyle(this.emissiveColorPicker.value);

		this.sizeSlider = document.getElementById('sizeSlider');
		this.sizeSlider.addEventListener('input', (e) => {
			this.particleScale = e.target.value;
			this.mesh.program.uniforms.u_scale.value = (sharedProps.isMobile ? 1.5 : 1) * mathUtils.fit(this.particleScale, 0, 1, 0.01, 0.05);
		});

		this.metalnessSlider = document.getElementById('metalnessSlider');
		this.metalnessSlider.addEventListener('input', (e) => {
			this.metalness = e.target.value;
		});

		this.roughnessSlider = document.getElementById('roughnessSlider');
		this.roughnessSlider.addEventListener('input', (e) => {
			this.roughness = e.target.value;
		});
	}

	resize(width, height) {}

	update(dt) {
		if (!this.isReady) return;
		particlesSim.update(dt);
	}

	draw(camera, buffer, clear = false) {
		if (!this.isReady) return;

		this.mesh.program = this.program;
		this.mesh.program.uniforms.u_metalness.value = this.metalness;
		this.mesh.program.uniforms.u_roughness.value = this.roughness;

		glUtils.render(this.mesh, camera, buffer, clear);
	}

	drawDepth(shadowCamera, shadowBuffer, clear = false) {
		if (!this.isReady) return;
		this.mesh.program = this.programDepth;
		glUtils.render(this.mesh, shadowCamera, shadowBuffer, clear);
	}
}

export default new Particles();
