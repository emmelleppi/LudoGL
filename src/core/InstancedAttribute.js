import Attribute from '@core/Attribute';
import { DRAW } from '@core/constants';

export default class InstancedAttribute extends Attribute {
	constructor(array, itemSize, usage = DRAW.STATIC_DRAW) {
		super(array, itemSize, usage);
		this.isInstanced = true;
	}
}
