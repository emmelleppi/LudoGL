export default class Vector4 extends Float32Array {
  constructor(x = 0, y = 0, z = 0, w = 0) {
    super(4);
    this.set(x, y, z, w);
    return this;
  }

  set(x, y, z, w) {
    this[0] = x;
    this[1] = y;
    this[2] = z;
    this[3] = w;
    return this;
  }

  copy(v) {
    this[0] = v[0];
    this[1] = v[1];
    this[2] = v[2];
    this[3] = v[3];
    return this;
  }

  add(v) {
    this[0] += v[0];
    this[1] += v[1];
    this[2] += v[2];
    this[3] += v[3];
    return this;
  }

  addScalar(scalar) {
    this[0] += scalar;
    this[1] += scalar;
    this[2] += scalar;
    this[3] += scalar;
    return this;
  }

  sub(v) {
    this[0] -= v[0];
    this[1] -= v[1];
    this[2] -= v[2];
    this[3] -= v[3];
    return this;
  }

  subScalar(scalar) {
    this.addScalar(-scalar);
    return this;
  }

  multiply(v) {
    if (typeof v === 'number') {
      this[0] *= v;
      this[1] *= v;
      this[2] *= v;
      this[3] *= v;
    } else {
      this[0] *= v[0];
      this[1] *= v[1];
      this[2] *= v[2];
      this[3] *= v[3];
    }
    return this;
  }

  multiplyScalar(scalar) {
    this[0] *= scalar;
    this[1] *= scalar;
    this[2] *= scalar;
    this[3] *= scalar;
    return this;
  }

  addScaledVector(v, s) {
    this[0] += v[0] * s;
    this[1] += v[1] * s;
    this[2] += v[2] * s;
    this[3] += v[3] * s;
    return this;
  }

  length() {
    const x = this[0];
    const y = this[1];
    const z = this[2];
    const w = this[3];
    return Math.sqrt(x * x + y * y + z * z + w * w);
  }

  normalize() {
    const x = this[0];
    const y = this[1];
    const z = this[2];
    const w = this[3];
    let len = x * x + y * y + z * z + w * w;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
    }
    this[0] = x * len;
    this[1] = y * len;
    this[2] = z * len;
    this[3] = w * len;
    return this;
  }

  dot(v) {
    return this[0] * v[0] + this[1] * v[1] + this[2] * v[2] + this[3] * v[3];
  }

  lerp(v, alpha) {
    const x = this[0];
    const y = this[1];
    const z = this[2];
    const w = this[3];
    this[0] = x + alpha * (v[0] - x);
    this[1] = y + alpha * (v[1] - y);
    this[2] = z + alpha * (v[2] - z);
    this[3] = w + alpha * (v[3] - w);
    return this;
  }

  transformMat4(m) {
    const x = this[0];
    const y = this[1];
    const z = this[2];
    const w = this[3];

    this[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    this[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    this[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    this[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;

    return this;
  }

  fromArray(a, o = 0) {
    this[0] = a[o];
    this[1] = a[o + 1];
    this[2] = a[o + 2];
    this[3] = a[o + 3];
    return this;
  }

  toArray(a = [], o = 0) {
    a[o] = this[0];
    a[o + 1] = this[1];
    a[o + 2] = this[2];
    a[o + 3] = this[3];
    return a;
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

  get w() {
    return this[3];
  }

  set w(value) {
    this[3] = value;
  }

  clone() {
    return new Vector4(this[0], this[1], this[2], this[3]);
  }
}
