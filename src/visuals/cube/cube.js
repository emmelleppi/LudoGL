import glUtils from '@core/glUtils';
import Program from '@core/Program';
import Texture from '@core/Texture';
import Mesh from '@core/Mesh';
import cubeVert from './cube.vert';
import cubeFrag from './cube.frag';
import { CULL, FILTER, WRAP } from '@core/constants';
import sharedProps from '@/sharedProps';
import PlaneGeometry from '@geometries/PlaneGeometry';
import lightShadow from '@visuals/light/lightShadow';
import light from '../light/light';
import Color from '@math/Color';

const TEXTURES = {
	floor: {
		base: '/cube/floor/base.jpg',
		normal: '/cube/floor/normal.jpg',
		roughness: '/cube/floor/roughness.jpg',
		ao: '/cube/floor/ao.jpg',
	},
	walls: {
		base: '/cube/walls/base.jpg',
		normal: '/cube/walls/normal.png',
		roughness: '/cube/walls/roughness.jpg',
		ao: '/cube/walls/ao.jpg',
	},
};

class Cube {
	cubeMeshes = [];
	cubePrograms = [];
	cubeEnvPrograms = [];

	textures = {};

	constructor() {}

	preInit() {
		for (const [key, value] of Object.entries(TEXTURES)) {
			this.textures[key] = {};
			for (const [subKey, subValue] of Object.entries(value)) {
				const texture = new Texture(null, 1, 1, {
					filter: FILTER.LINEAR_MIPMAP_LINEAR,
					wrap: WRAP.REPEAT,
				});
				texture.loadImage(subValue);
				this.textures[key][subKey] = texture;
			}
		}
	}

	init() {
		const size = 3; // Half size of cube faces
		const planeGeometry = new PlaneGeometry(size * 2, size * 2);

		const faces = [
			{ type: 'walls', color: new Color().setStyle('#fff'), position: [0, 0, size], rotation: [0, 0, 0] }, // Front
			{ type: 'walls', color: new Color().setStyle('#fff'), position: [0, 0, -size], rotation: [0, Math.PI, 0] }, // Back
			{ type: 'walls', color: new Color().setStyle('#fff'), position: [size, 0, 0], rotation: [0, Math.PI / 2, 0] }, // Right
			{ type: 'walls', color: new Color().setStyle('#fff'), position: [-size, 0, 0], rotation: [0, -Math.PI / 2, 0] }, // Left
			{ type: 'walls', color: new Color().setStyle('#fff'), position: [0, size, 0], rotation: [-Math.PI / 2, 0, 0] }, // ceil
			{ type: 'floor', color: new Color().setStyle('#fff'), position: [0, -size, 0], rotation: [Math.PI / 2, 0, 0] }, // Floor
		];

		for (const face of faces) {
			const texture = this.textures[face.type];

			const program = new Program({
				uniforms: Object.assign(
					{
						u_baseTexture: { value: texture.base },
						u_normalTexture: { value: texture.normal },
						u_roughnessTexture: { value: texture.roughness },
						u_aoTexture: { value: texture.ao },
						u_metallicTexture: { value: texture.metallic },
						u_color: { value: face.color },
					},
					lightShadow.sharedUniforms,
					sharedProps.blueNoiseSharedUniforms,
				),
				vert: cubeVert,
				frag: cubeFrag,
				defines: {
					MIN_ROUGHNESS: sharedProps.minRoughness,
					METALLIC: texture.metallic ? 1 : 0,
				},
				cullFace: CULL.FRONT,
			});

			const programEnv = new Program({
				uniforms: Object.assign({
					u_baseTexture: { value: texture.base },
					u_normalTexture: { value: texture.normal },
					u_roughnessTexture: { value: texture.roughness },
					u_aoTexture: { value: texture.ao },
					u_metallicTexture: { value: texture.metallic },
					u_lightPosition: { value: light.position },
					u_color: { value: face.color },
				}),
				vert: cubeVert,
				frag: cubeFrag,
				defines: {
					MIN_ROUGHNESS: sharedProps.minRoughness,
					METALLIC: texture.metallic ? 1 : 0,
					IS_FOR_ENV: 1,
				},
				cullFace: CULL.FRONT,
			});

			const mesh = new Mesh(planeGeometry, program);
			mesh.position.set(...face.position);
			mesh.rotation.set(...face.rotation);
			this.cubeMeshes.push(mesh);
			this.cubePrograms.push(program);
			this.cubeEnvPrograms.push(programEnv);
		}
	}

	resize(width, height) {}

	update(dt) {}

	draw(camera, gBuffer, clear = false) {
		if (!this.cubeMeshes.length) return;

		for (let i = 0; i < this.cubeMeshes.length; i++) {
			const mesh = this.cubeMeshes[i];
			const program = this.cubePrograms[i];
			mesh.program = program;
			glUtils.render(mesh, camera, gBuffer, i === 0 && clear);
		}
	}

	prepareForDrawEnv() {
		if (!this.cubeMeshes.length) return;

		for (let i = 0; i < this.cubeMeshes.length; i++) {
			const mesh = this.cubeMeshes[i];
			const program = this.cubeEnvPrograms[i];
			mesh.program = program;
		}
	}
}

export default new Cube();
