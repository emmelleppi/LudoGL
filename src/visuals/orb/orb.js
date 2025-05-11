import glUtils from '@core/glUtils';
import Program from '@core/Program';
import Mesh from '@core/Mesh';
import orbVert from './orb.vert';
import orbFrag from './orb.frag';
import SphereGeometry from '@geometries/SphereGeometry';
import sharedProps from '../../sharedProps';
import { BLEND } from '../../core/constants';
import gBufferPass from '../../gBufferPass/gBufferPass';
import envMapGenerator from '../../envMapGenerator/envMapGenerator';
import light from '../light/light';

class Orb {
	orbMesh = null;
	orbProgram = null;
	orbGeometry = null;

	constructor() {}

	preInit() {}

	init() {
		this.orbGeometry = new SphereGeometry(0.15, 32);
		this.orbProgram = new Program({
			uniforms: {
				u_sceneTexture: { value: null },
				u_depthTexture: { value: gBufferPass.frameBuffer.depthTexture },
				u_envMap: envMapGenerator.sharedUniforms.u_specularEnvMap,
				u_resolution: sharedProps.sharedUniforms.u_resolution,
				u_near: { value: 0 },
				u_far: { value: 0 },
				u_lightPosition: { value: light.position },
			},
			vert: orbVert,
			frag: orbFrag,
			blendMode: BLEND.NORMAL,
		});
		this.orbMesh = new Mesh(this.orbGeometry, this.orbProgram);
	}

	resize(width, height) {}

	update(dt) {
		this.orbMesh.position.x = Math.sin(sharedProps.time) * 1.5;
		// this.orbMesh.position.y = Math.cos(sharedProps.time) * 1.5;
		this.orbMesh.position.z = Math.cos(sharedProps.time) * 1.5;
	}

	draw(camera, cacheLightTexture, buffer, clear = false) {
		this.orbProgram.uniforms.u_near.value = camera.near;
		this.orbProgram.uniforms.u_far.value = camera.far;
		this.orbProgram.uniforms.u_sceneTexture.value = cacheLightTexture;
		glUtils.render(this.orbMesh, camera, buffer, clear);
	}
}

export default new Orb();
