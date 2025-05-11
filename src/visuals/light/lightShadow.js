import OrthographicCamera from '@core/OrthographicCamera';
import Vector3 from '@math/Vector3';
import Framebuffer from '@core/Framebuffer';
import Matrix4 from '@math/Matrix4';
import Vector2 from '@math/Vector2';
import light from './light';
import { DEPTH_TYPE, TYPE } from '../../core/constants';

const biasMat = new Matrix4();
biasMat.set(0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.5, 0.0, 0.5, 0.5, 0.5, 1.0);

class LightShadow {
  sharedUniforms = {
    u_shadowMap: { value: null },
    u_shadowBias: { value: 0.05 },
    u_shadowNormalBias: { value: 0 },
    u_shadowMapSize: { value: new Vector2() },
    u_shadowMatrix: { value: new Matrix4() },
  };

  constructor() {}

  preInit() {}

  init() {
    this.shadowCamera = new OrthographicCamera();
    this.shadowBuffer = new Framebuffer({
      width: 256,
      height: 256,
      depth: true,
      colorWrite: false,
	  depthType: DEPTH_TYPE.DEPTH_COMPONENT16,

    });
    this.sharedUniforms.u_shadowMap.value = this.shadowBuffer.depthTexture;
    this.sharedUniforms.u_shadowMapSize.value.set(
      this.shadowBuffer.width,
      this.shadowBuffer.height
    );
  }

  resize(width, height) {
    this.shadowCamera.left = -1.5;
    this.shadowCamera.right = 1.5;
    this.shadowCamera.top = 1.5;
    this.shadowCamera.bottom = -1.5;
    this.shadowCamera.near = 0.5;
    this.shadowCamera.far = 6;
    this.shadowCamera.zoom = 1;
    this.shadowCamera.position.copy(light.position);
    this.shadowCamera.lookAt(new Vector3(0, 0, 0));
    this.shadowCamera.updateProjectionMatrix();
    this.shadowCamera.updateMatrixWorld();
  }

  update(dt) {
    this.sharedUniforms.u_shadowMatrix.value.copy(biasMat);
    this.sharedUniforms.u_shadowMatrix.value.multiply(this.shadowCamera.projectionMatrix);
    this.sharedUniforms.u_shadowMatrix.value.multiply(this.shadowCamera.matrixWorldInverse);
  }
}

export default new LightShadow();
