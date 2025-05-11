import helmet from '@visuals/helmet/helmet';
import cube from '@visuals/cube/cube';
import light from '@visuals/light/light';
import particles from '@visuals/particles/particles';
import glUtils from '@core/glUtils';
import orb from './orb/orb';

class Visuals {
	showHelmet = false;

	preInit() {
		cube.preInit();
		helmet.preInit();
		light.preInit();
		particles.preInit();
		orb.preInit();
	}

	init() {
		cube.init();
		helmet.init();
		light.init();
		particles.init();
		orb.init();

		document.getElementById('showHelmetButton').addEventListener('change', () => {
			this.showHelmet = !this.showHelmet;
		});
	}

	resize(width, height) {
		cube.resize(width, height);
		helmet.resize(width, height);
		light.resize(width, height);
		particles.resize(width, height);
		orb.resize(width, height);
	}

	update(dt) {
		cube.update(dt);
		light.update(dt);
		if (this.showHelmet) {
			helmet.update(dt);
		} else {
			particles.update(dt);
		}
		orb.update(dt);
	}

	draw(camera, buffer) {
		cube.draw(camera, buffer, true);
		light.draw(camera, buffer, false);
		if (this.showHelmet) {
			helmet.draw(camera, buffer, false);
		} else {
			particles.draw(camera, buffer, false);
		}
	}

	drawDepth(shadowCamera, shadowBuffer) {
		glUtils.clearColor = glUtils.clearColorWhite;
		if (this.showHelmet) {
			helmet.drawDepth(shadowCamera, shadowBuffer, true);
		} else {
			particles.drawDepth(shadowCamera, shadowBuffer, true);
		}
		glUtils.clearColor = glUtils.clearColorTransparent;
	}

	drawTransparency(camera, cacheLightTexture, buffer) {
		orb.draw(camera, cacheLightTexture, buffer, false);
	}
}

export default new Visuals();
