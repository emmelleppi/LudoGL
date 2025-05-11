import glUtils from '@core/glUtils';
import Program from '@core/Program';
import Texture3D from '@core/Texture3D';
import Vector3 from '@math/Vector3';
import { loadCubeLUT } from '@utils/CubeLUTLoader';
import Effect from '../Effect';
import lut3DFrag from './lut3D.frag';

export default class LUT3D extends Effect {
	name = 'LUT3D';
	program = null;

	sharedUniforms = {
		u_lut: { value: null },
		u_scale: { value: new Vector3() },
		u_offset: { value: new Vector3() },
	};

	constructor(options = {}) {
		super(options);

		/**
		 * BlueHour
		 * ColdChrome
		 * CrispAutumn
		 * DarkAndSomber
		 * HardBoost
		 * LongBeachMorning
		 * MagicHour
		 * NaturalBoost
		 * OrangeAndBlue
		 * SoftBlackAndWhite
		 * Waves
		 */

		loadCubeLUT('/lut/cubes/BlueHour.cube').then((lut) => {
			const lut3DTexture = new Texture3D(lut.data, lut.size);
			const size = lut.size;
			const ds = [lut.domainMax[0] - lut.domainMin[0], lut.domainMax[1] - lut.domainMin[1], lut.domainMax[2] - lut.domainMin[2]];
			const scale = ds.map((d, i) => (size - 1) / d);
			const offset = lut.domainMin.map((v, i) => -v * scale[i]);

			this.sharedUniforms.u_scale.value.set(scale[0], scale[1], scale[2]);
			this.sharedUniforms.u_offset.value.set(offset[0], offset[1], offset[2]);
			this.sharedUniforms.u_lut.value = lut3DTexture;

			this.program = new Program({
				isRaw: true,
				uniforms: Object.assign(
					{
						u_intensity: { value: 0.5 },
						u_inputTexture: { value: null },
					},
					this.sharedUniforms,
				),
				frag: lut3DFrag,
				defines: {
					LUT_TEXEL_WIDTH: (1.0 / size).toFixed(16),
					LUT_TEXEL_HEIGHT: (1.0 / size).toFixed(16),
				},
			});
		});
	}

	update(dt) {
		super.update(dt);
	}

	render(inputTexture, outputFramebuffer) {
		super.render(inputTexture, outputFramebuffer);
		this.program.uniforms.u_inputTexture.value = inputTexture;
		glUtils.renderProgram(this.program, outputFramebuffer);
	}
}
