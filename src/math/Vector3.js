export default class Vector3 extends Float32Array {
  constructor(x = 0, y = 0, z = 0) {
    super(3);
    this.set(x, y, z);
    return this;
  }

  set(x, y, z) {
    this[0] = x;
    this[1] = y;
    this[2] = z;
    return this;
  }

  setScalar(scalar) {
    this[0] = scalar;
    this[1] = scalar;
    this[2] = scalar;
    return this;
  }

  copy(v) {
    this[0] = v[0];
    this[1] = v[1];
    this[2] = v[2];
    return this;
  }

  add(v) {
    this[0] += v[0];
    this[1] += v[1];
    this[2] += v[2];
    return this;
  }

  addScalar(scalar) {
    this[0] += scalar;
    this[1] += scalar;
    this[2] += scalar;
    return this;
  }

  sub(v) {
    this[0] -= v[0];
    this[1] -= v[1];
    this[2] -= v[2];
    return this;
  }

  subScalar(scalar) {
    this[0] -= scalar;
    this[1] -= scalar;
    this[2] -= scalar;
    return this;
  }

  multiply(v) {
    this[0] *= v[0];
    this[1] *= v[1];
    this[2] *= v[2];
    return this;
  }

  multiplyScalar(scalar) {
    this[0] *= scalar;
    this[1] *= scalar;
    this[2] *= scalar;
    return this;
  }

  divide(v) {
    this[0] /= v[0];
    this[1] /= v[1];
    this[2] /= v[2];
    return this;
  }

  divideScalar(scalar) {
    return this.multiplyScalar(1 / scalar);
  }

  dot(v) {
    return this[0] * v[0] + this[1] * v[1] + this[2] * v[2];
  }

  cross(v) {
    const x = this[0];
    const y = this[1];
    const z = this[2];

    this[0] = y * v[2] - z * v[1];
    this[1] = z * v[0] - x * v[2];
    this[2] = x * v[1] - y * v[0];

    return this;
  }

  _length() {
    return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2]);
  }

  normalize() {
    const len = this._length();
    if (len > 0) {
      this.multiplyScalar(1 / len);
    }
    return this;
  }

  distanceTo(v) {
    const dx = this[0] - v[0];
    const dy = this[1] - v[1];
    const dz = this[2] - v[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  squaredDistanceTo(v) {
    const dx = this[0] - v[0];
    const dy = this[1] - v[1];
    const dz = this[2] - v[2];
    return dx * dx + dy * dy + dz * dz;
  }

  lerp(v, alpha) {
    this[0] += (v[0] - this[0]) * alpha;
    this[1] += (v[1] - this[1]) * alpha;
    this[2] += (v[2] - this[2]) * alpha;
    return this;
  }

  transformMat4(m) {
    const x = this[0];
    const y = this[1];
    const z = this[2];
    const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1.0;

    this[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    this[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    this[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;

    return this;
  }

  transformQuat(q) {
    const x = this[0];
    const y = this[1];
    const z = this[2];
    const qx = q[0];
    const qy = q[1];
    const qz = q[2];
    const qw = q[3];

    // calculate quat * vector
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    this[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return this;
  }

  get x() {
    return this[0];
  }

  set x(value) {
    this[0] = value;
  }

  get y() {
    return this[1];
  }

  set y(value) {
    this[1] = value;
  }

  get z() {
    return this[2];
  }

  set z(value) {
    this[2] = value;
  }

  clone() {
    return new Vector3(this[0], this[1], this[2]);
  }

  fromArray(array, offset = 0) {
    this[0] = array[offset];
    this[1] = array[offset + 1];
    this[2] = array[offset + 2];
    return this;
  }

  toArray(array = [], offset = 0) {
    array[offset] = this[0];
    array[offset + 1] = this[1];
    array[offset + 2] = this[2];
    return array;
  }

  min(v) {
    this[0] = Math.min(this[0], v[0]);
    this[1] = Math.min(this[1], v[1]);
    this[2] = Math.min(this[2], v[2]);
    return this;
  }

  max(v) {
    this[0] = Math.max(this[0], v[0]);
    this[1] = Math.max(this[1], v[1]);
    this[2] = Math.max(this[2], v[2]);
    return this;
  }

  squaredLength() {
    return this[0] * this[0] + this[1] * this[1] + this[2] * this[2];
  }

  inverse() {
    this[0] = 1.0 / this[0];
    this[1] = 1.0 / this[1];
    this[2] = 1.0 / this[2];
    return this;
  }

  angle(v) {
    const tempA = new Vector3();
    const tempB = new Vector3();

    tempA.copy(this).normalize();
    tempB.copy(v).normalize();

    const cosine = tempA.dot(tempB);

    if (cosine > 1.0) {
      return 0;
    } else if (cosine < -1.0) {
      return Math.PI;
    } else {
      return Math.acos(cosine);
    }
  }

  scaleRotateMatrix4(m) {
    const x = this[0];
    const y = this[1];
    const z = this[2];
    const w = m[3] * x + m[7] * y + m[11] * z + m[15] || 1.0;

    this[0] = (m[0] * x + m[4] * y + m[8] * z) / w;
    this[1] = (m[1] * x + m[5] * y + m[9] * z) / w;
    this[2] = (m[2] * x + m[6] * y + m[10] * z) / w;

    return this;
  }

  smoothLerp(v, decay, dt) {
    const exp = Math.exp(-decay * dt);
    const x = this[0];
    const y = this[1];
    const z = this[2];

    this[0] = v[0] + (x - v[0]) * exp;
    this[1] = v[1] + (y - v[1]) * exp;
    this[2] = v[2] + (z - v[2]) * exp;
    return this;
  }

  crossVectors(a, b) {
    const ax = a[0],
      ay = a[1],
      az = a[2];
    const bx = b[0],
      by = b[1],
      bz = b[2];

    this[0] = ay * bz - az * by;
    this[1] = az * bx - ax * bz;
    this[2] = ax * by - ay * bx;
    return this;
  }

  addScaledVector(v, s) {
    this[0] += v[0] * s;
    this[1] += v[1] * s;
    this[2] += v[2] * s;
    return this;
  }

  subtractVectors(a, b) {
    this[0] = a[0] - b[0];
    this[1] = a[1] - b[1];
    this[2] = a[2] - b[2];
    return this;
  }

  applyMatrix3(m) {
    const x = this[0];
    const y = this[1];
    const z = this[2];

    this[0] = m[0] * x + m[3] * y + m[6] * z;
    this[1] = m[1] * x + m[4] * y + m[7] * z;
    this[2] = m[2] * x + m[5] * y + m[8] * z;
    return this;
  }

  transformDirection(m) {
    const x = this[0];
    const y = this[1];
    const z = this[2];

    this[0] = m[0] * x + m[4] * y + m[8] * z;
    this[1] = m[1] * x + m[5] * y + m[9] * z;
    this[2] = m[2] * x + m[6] * y + m[10] * z;

    return this.normalize();
  }

  equals(v) {
    return this[0] === v[0] && this[1] === v[1] && this[2] === v[2];
  }

  exactEquals(v) {
    return this.equals(v);
  }

  distance() {
    return this._length();
  }

  squaredDistance(v) {
    const dx = this[0] - v[0];
    const dy = this[1] - v[1];
    const dz = this[2] - v[2];
    return dx * dx + dy * dy + dz * dz;
  }

  applyMatrix4(m) {
    return this.transformMat4(m);
  }

  toArray() {
    return [this[0], this[1], this[2]];
  }
}
