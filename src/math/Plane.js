import Vector3 from './Vector3';

class Plane {
  constructor(normal = new Vector3(0, 0, 1), constant = 0) {
    this.normal = normal;
    this.constant = constant;
  }

  setComponents(x, y, z, w) {
    this.normal.set(x, y, z);
    this.constant = w;
    return this;
  }

  normalize() {
    const inverseNormalLength = 1.0 / this.normal._length();
    this.normal.multiplyScalar(inverseNormalLength);
    this.constant *= inverseNormalLength;
    return this;
  }

  distanceToPoint(point) {
    return this.normal.dot(point) + this.constant;
  }
}

export default Plane;
