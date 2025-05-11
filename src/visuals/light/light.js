import glUtils from '@core/glUtils';
import Program from '@core/Program';
import Mesh from '@core/Mesh';
import lightVert from './light.vert';
import lightFrag from './light.frag';
import SphereGeometry from '@geometries/SphereGeometry';
import Vector3 from '@math/Vector3';

class Light {
	lightMesh = null;
	lightProgram = null;
	lightGeometry = null;

	uniforms = {
		u_scale: { value: 0.15 },
	};

	position = new Vector3(0, 2.6, 0);

	constructor() {}

	preInit() {}

	init() {
		this.lightGeometry = new SphereGeometry(1, 32, 32);
		this.lightProgram = new Program({
			uniforms: Object.assign(this.uniforms),
			vert: lightVert,
			frag: lightFrag,
		});
		this.lightMesh = new Mesh(this.lightGeometry, this.lightProgram);
		this.lightMesh.position.copy(this.position);
	}

	resize(width, height) {}

	update(dt) {}

	draw(camera, gBuffer, clear = false) {
		glUtils.render(this.lightMesh, camera, gBuffer, clear);
	}
}

export default new Light();
