export default class Vector2 extends Float32Array {
  constructor(x = 0, y = 0) {
    super(2);
    this[0] = x;
    this[1] = y;
    return this;
  }

  set(x, y) {
    this[0] = x;
    this[1] = y;
    return this;
  }

  copy(v) {
    this[0] = v[0];
    this[1] = v[1];
    return this;
  }

  add(v) {
    this[0] += v[0];
    this[1] += v[1];
    return this;
  }

  addScalar(scalar) {
    this[0] += scalar;
    this[1] += scalar;
    return this;
  }

  sub(v) {
    this[0] -= v[0];
    this[1] -= v[1];
    return this;
  }

  subScalar(scalar) {
    this[0] -= scalar;
    this[1] -= scalar;
    return this;
  }

  subVectors(a, b) {
    this[0] = a[0] - b[0];
    this[1] = a[1] - b[1];
    return this;
  }

  multiply(v) {
    this[0] *= v[0];
    this[1] *= v[1];
    return this;
  }

  multiplyScalar(scalar) {
    this[0] *= scalar;
    this[1] *= scalar;
    return this;
  }

  addScaledVector(v, s) {
    this[0] += v[0] * s;
    this[1] += v[1] * s;
    return this;
  }

  _length() {
    return Math.sqrt(this[0] * this[0] + this[1] * this[1]);
  }

  normalize() {
    const len = this._length();
    if (len > 0) {
      const invLen = 1 / len;
      this[0] *= invLen;
      this[1] *= invLen;
    }
    return this;
  }

  dot(v) {
    return this[0] * v[0] + this[1] * v[1];
  }

  lerp(v, alpha) {
    this[0] += (v[0] - this[0]) * alpha;
    this[1] += (v[1] - this[1]) * alpha;
    return this;
  }

  distanceTo(v) {
    const dx = this[0] - v[0];
    const dy = this[1] - v[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  squaredDistance(v) {
    const dx = this[0] - v[0];
    const dy = this[1] - v[1];
    return dx * dx + dy * dy;
  }

  distance() {
    return Math.sqrt(this[0] * this[0] + this[1] * this[1]);
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

  clone() {
    return new Vector2(this[0], this[1]);
  }
}
