import glUtils from '@core/glUtils';
import Program from '@core/Program';
import Texture from '@core/Texture';
import Mesh from '@core/Mesh';
import { OBJParser } from '@utils/ObjParser';
import helmetVert from './helmet.vert';
import helmetFrag from './helmet.frag';
import { FILTER } from '@core/constants';
import sharedProps from '@/sharedProps';
import lightShadow from '@visuals/light/lightShadow';

class Helmet {
	helmetMesh = null;
	program = null;
	geometry = null;

	isReady = false;

	uniforms = {
		u_baseTexture: { value: null },
		u_normalTexture: { value: null },
		u_metalRoughnessTexture: { value: null },
		u_aoTexture: { value: null },
		u_emissiveTexture: { value: null },
	};

	constructor() {}

	preInit() {
		const parser = new OBJParser();
		parser.parseOBJ('/helmet.obj').then((geometry) => {
			this.geometry = geometry;
		});

		const baseTexture = new Texture(null, 1, 1, {
			filter: FILTER.LINEAR_MIPMAP_LINEAR,
		});
		baseTexture.loadImage('/albedo.jpg');
		this.uniforms.u_baseTexture.value = baseTexture;

		const normalTexture = new Texture(null, 1, 1, {
			filter: FILTER.LINEAR_MIPMAP_NEAREST,
		});
		normalTexture.loadImage('/normal.jpg');
		this.uniforms.u_normalTexture.value = normalTexture;

		const metalRoughnessTexture = new Texture(null, 1, 1, {
			filter: FILTER.LINEAR_MIPMAP_NEAREST,
		});
		metalRoughnessTexture.loadImage('/metalRoughness.jpg');
		this.uniforms.u_metalRoughnessTexture.value = metalRoughnessTexture;

		const aoTexture = new Texture(null, 1, 1, {
			filter: FILTER.LINEAR_MIPMAP_LINEAR,
		});
		aoTexture.loadImage('/ao.jpg');
		this.uniforms.u_aoTexture.value = aoTexture;

		const emissiveTexture = new Texture(null, 1, 1, {
			filter: FILTER.LINEAR_MIPMAP_LINEAR,
		});
		emissiveTexture.loadImage('/emissive.jpg');
		this.uniforms.u_emissiveTexture.value = emissiveTexture;
	}

	init() {
		this.isReady = true;
	}

	createMesh() {
		this.program = new Program({
			uniforms: Object.assign(this.uniforms, lightShadow.sharedUniforms, sharedProps.blueNoiseSharedUniforms),
			vert: helmetVert,
			frag: helmetFrag,
			defines: {
				MIN_ROUGHNESS: sharedProps.minRoughness,
			},
		});
		this.programDepth = new Program({
			uniforms: Object.assign(this.uniforms, lightShadow.sharedUniforms, sharedProps.blueNoiseSharedUniforms),
			vert: helmetVert,
			frag: `void main() {}`,
			defines: {
				IS_DEPTH: true,
			},
		});
		this.helmetMesh = new Mesh(this.geometry, this.program);
	}

	resize(width, height) {}

	update(dt) {
		if (this.isReady && this.geometry && !this.helmetMesh) {
			this.createMesh();
		}
	}

	draw(camera, gBuffer, clear = false) {
		if (!this.helmetMesh) return;

		this.helmetMesh.program = this.program;
		glUtils.render(this.helmetMesh, camera, gBuffer, clear);
	}

	drawDepth(camera, depthBuffer, clear = false) {
		if (!this.helmetMesh) return;
		this.helmetMesh.program = this.programDepth;
		glUtils.render(this.helmetMesh, camera, depthBuffer, clear);
	}
}

export default new Helmet();
