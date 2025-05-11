export default class Quaternion extends Float32Array {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    super(4);
    this.onChange = () => {};
    this._target = this;

    this.set(x, y, z, w);

    // Return a proxy to trigger onChange when array elements are edited directly
    const triggerProps = ['0', '1', '2', '3'];
    return new Proxy(this, {
      set(target, property, value) {
        const success = Reflect.set(target, property, value);
        if (success && triggerProps.includes(property)) target.onChange();
        return success;
      },
    });
  }

  set(x, y, z, w) {
    this._target[0] = x;
    this._target[1] = y;
    this._target[2] = z;
    this._target[3] = w;
    this.onChange();
    return this;
  }

  copy(quat) {
    this._target[0] = quat[0];
    this._target[1] = quat[1];
    this._target[2] = quat[2];
    this._target[3] = quat[3];
    this.onChange();
    return this;
  }

  fromEuler(e, isInternal) {
    const sx = Math.sin(e[0] * 0.5);
    const cx = Math.cos(e[0] * 0.5);
    const sy = Math.sin(e[1] * 0.5);
    const cy = Math.cos(e[1] * 0.5);
    const sz = Math.sin(e[2] * 0.5);
    const cz = Math.cos(e[2] * 0.5);

    const order = e.order || 'YXZ';

    if (order === 'XYZ') {
      this._target[0] = sx * cy * cz + cx * sy * sz;
      this._target[1] = cx * sy * cz - sx * cy * sz;
      this._target[2] = cx * cy * sz + sx * sy * cz;
      this._target[3] = cx * cy * cz - sx * sy * sz;
    } else if (order === 'YXZ') {
      this._target[0] = sx * cy * cz + cx * sy * sz;
      this._target[1] = cx * sy * cz - sx * cy * sz;
      this._target[2] = cx * cy * sz - sx * sy * cz;
      this._target[3] = cx * cy * cz + sx * sy * sz;
    } else if (order === 'ZXY') {
      this._target[0] = sx * cy * cz - cx * sy * sz;
      this._target[1] = cx * sy * cz + sx * cy * sz;
      this._target[2] = cx * cy * sz + sx * sy * cz;
      this._target[3] = cx * cy * cz - sx * sy * sz;
    } else if (order === 'ZYX') {
      this._target[0] = sx * cy * cz - cx * sy * sz;
      this._target[1] = cx * sy * cz + sx * cy * sz;
      this._target[2] = cx * cy * sz - sx * sy * cz;
      this._target[3] = cx * cy * cz + sx * sy * sz;
    } else if (order === 'YZX') {
      this._target[0] = sx * cy * cz + cx * sy * sz;
      this._target[1] = cx * sy * cz + sx * cy * sz;
      this._target[2] = cx * cy * sz - sx * sy * cz;
      this._target[3] = cx * cy * cz - sx * sy * sz;
    } else if (order === 'XZY') {
      this._target[0] = sx * cy * cz - cx * sy * sz;
      this._target[1] = cx * sy * cz - sx * cy * sz;
      this._target[2] = cx * cy * sz + sx * sy * cz;
      this._target[3] = cx * cy * cz + sx * sy * sz;
    }

    if (!isInternal) this.onChange();
    return this;
  }

  setFromRotationMatrix(m) {
    const te = m;
    const m11 = te[0],
      m12 = te[4],
      m13 = te[8];
    const m21 = te[1],
      m22 = te[5],
      m23 = te[9];
    const m31 = te[2],
      m32 = te[6],
      m33 = te[10];

    const trace = m11 + m22 + m33;

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);
      this._target[3] = 0.25 / s;
      this._target[0] = (m32 - m23) * s;
      this._target[1] = (m13 - m31) * s;
      this._target[2] = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
      this._target[3] = (m32 - m23) / s;
      this._target[0] = 0.25 * s;
      this._target[1] = (m12 + m21) / s;
      this._target[2] = (m13 + m31) / s;
    } else if (m22 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
      this._target[3] = (m13 - m31) / s;
      this._target[0] = (m12 + m21) / s;
      this._target[1] = 0.25 * s;
      this._target[2] = (m23 + m32) / s;
    } else {
      const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
      this._target[3] = (m21 - m12) / s;
      this._target[0] = (m13 + m31) / s;
      this._target[1] = (m23 + m32) / s;
      this._target[2] = 0.25 * s;
    }
    this.onChange();
    return this;
  }

  multiply(q) {
    const ax = this._target[0],
      ay = this._target[1],
      az = this._target[2],
      aw = this._target[3];
    const bx = q[0],
      by = q[1],
      bz = q[2],
      bw = q[3];

    this._target[0] = ax * bw + aw * bx + ay * bz - az * by;
    this._target[1] = ay * bw + aw * by + az * bx - ax * bz;
    this._target[2] = az * bw + aw * bz + ax * by - ay * bx;
    this._target[3] = aw * bw - ax * bx - ay * by - az * bz;
    this.onChange();
    return this;
  }

  conjugate() {
    this._target[0] = -this._target[0];
    this._target[1] = -this._target[1];
    this._target[2] = -this._target[2];
    this.onChange();
    return this;
  }

  invert() {
    const dot =
      this._target[0] * this._target[0] +
      this._target[1] * this._target[1] +
      this._target[2] * this._target[2] +
      this._target[3] * this._target[3];
    const invDot = dot ? 1.0 / dot : 0;

    this._target[0] = -this._target[0] * invDot;
    this._target[1] = -this._target[1] * invDot;
    this._target[2] = -this._target[2] * invDot;
    this._target[3] = this._target[3] * invDot;
    this.onChange();
    return this;
  }

  normalize() {
    const len = Math.sqrt(
      this._target[0] * this._target[0] +
        this._target[1] * this._target[1] +
        this._target[2] * this._target[2] +
        this._target[3] * this._target[3]
    );

    if (len > 0) {
      const invLen = 1 / len;
      this._target[0] *= invLen;
      this._target[1] *= invLen;
      this._target[2] *= invLen;
      this._target[3] *= invLen;
    }
    this.onChange();
    return this;
  }

  slerp(q, t) {
    const ax = this._target[0],
      ay = this._target[1],
      az = this._target[2],
      aw = this._target[3];
    let bx = q[0],
      by = q[1],
      bz = q[2],
      bw = q[3];

    let omega, cosom, sinom, scale0, scale1;

    // calc cosine
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    // adjust signs (if necessary)
    if (cosom < 0.0) {
      cosom = -cosom;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    // calculate coefficients
    if (1.0 - cosom > 0.000001) {
      // standard case (slerp)
      omega = Math.acos(cosom);
      sinom = Math.sin(omega);
      scale0 = Math.sin((1.0 - t) * omega) / sinom;
      scale1 = Math.sin(t * omega) / sinom;
    } else {
      // "from" and "to" quaternions are very close
      //  ... so we can do a linear interpolation
      scale0 = 1.0 - t;
      scale1 = t;
    }
    // calculate final values
    this._target[0] = scale0 * ax + scale1 * bx;
    this._target[1] = scale0 * ay + scale1 * by;
    this._target[2] = scale0 * az + scale1 * bz;
    this._target[3] = scale0 * aw + scale1 * bw;
    this.onChange();
    return this;
  }

  identity() {
    this._target[0] = 0;
    this._target[1] = 0;
    this._target[2] = 0;
    this._target[3] = 1;
    this.onChange();
    return this;
  }

  rotateX(angle) {
    angle *= 0.5;
    const ax = this._target[0],
      ay = this._target[1],
      az = this._target[2],
      aw = this._target[3];
    const bx = Math.sin(angle),
      bw = Math.cos(angle);

    this._target[0] = ax * bw + aw * bx;
    this._target[1] = ay * bw + az * bx;
    this._target[2] = az * bw - ay * bx;
    this._target[3] = aw * bw - ax * bx;
    this.onChange();
    return this;
  }

  rotateY(angle) {
    angle *= 0.5;
    const ax = this._target[0],
      ay = this._target[1],
      az = this._target[2],
      aw = this._target[3];
    const by = Math.sin(angle),
      bw = Math.cos(angle);

    this._target[0] = ax * bw - az * by;
    this._target[1] = ay * bw + aw * by;
    this._target[2] = az * bw + ax * by;
    this._target[3] = aw * bw - ay * by;
    this.onChange();
    return this;
  }

  rotateZ(angle) {
    angle *= 0.5;
    const ax = this._target[0],
      ay = this._target[1],
      az = this._target[2],
      aw = this._target[3];
    const bz = Math.sin(angle),
      bw = Math.cos(angle);

    this._target[0] = ax * bw + ay * bz;
    this._target[1] = ay * bw - ax * bz;
    this._target[2] = az * bw + aw * bz;
    this._target[3] = aw * bw - az * bz;
    this.onChange();
    return this;
  }

  inverse(q = this) {
    const dot = q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3];
    const invDot = dot ? 1.0 / dot : 0;

    this._target[0] = -q[0] * invDot;
    this._target[1] = -q[1] * invDot;
    this._target[2] = -q[2] * invDot;
    this._target[3] = q[3] * invDot;
    this.onChange();
    return this;
  }

  fromAxisAngle(axis, angle) {
    angle *= 0.5;
    const s = Math.sin(angle);
    this._target[0] = s * axis[0];
    this._target[1] = s * axis[1];
    this._target[2] = s * axis[2];
    this._target[3] = Math.cos(angle);
    this.onChange();
    return this;
  }

  addScalar(scalar) {
    this._target[0] += scalar;
    this._target[1] += scalar;
    this._target[2] += scalar;
    this._target[3] += scalar;
    this.onChange();
    return this;
  }

  multiplyScalar(scalar) {
    this._target[0] *= scalar;
    this._target[1] *= scalar;
    this._target[2] *= scalar;
    this._target[3] *= scalar;
    this.onChange();
    return this;
  }

  add(q) {
    this._target[0] += q[0];
    this._target[1] += q[1];
    this._target[2] += q[2];
    this._target[3] += q[3];
    this.onChange();
    return this;
  }

  dot(q) {
    return (
      this._target[0] * q[0] +
      this._target[1] * q[1] +
      this._target[2] * q[2] +
      this._target[3] * q[3]
    );
  }

  fromArray(array, offset = 0) {
    this._target[0] = array[offset];
    this._target[1] = array[offset + 1];
    this._target[2] = array[offset + 2];
    this._target[3] = array[offset + 3];
    this.onChange();
    return this;
  }

  toArray(array = [], offset = 0) {
    array[offset] = this[0];
    array[offset + 1] = this[1];
    array[offset + 2] = this[2];
    array[offset + 3] = this[3];
    return array;
  }

  get x() {
    return this[0];
  }

  set x(value) {
    this._target[0] = value;
    this.onChange();
  }

  get y() {
    return this[1];
  }

  set y(value) {
    this._target[1] = value;
    this.onChange();
  }

  get z() {
    return this[2];
  }

  set z(value) {
    this._target[2] = value;
    this.onChange();
  }

  get w() {
    return this[3];
  }

  set w(value) {
    this._target[3] = value;
    this.onChange();
  }

  clone() {
    return new Quaternion(this._target[0], this._target[1], this._target[2], this._target[3]);
  }
}
