import Matrix4 from '@math/Matrix4';

const tmpMat4 = new Matrix4();
export default class Euler extends Float32Array {
  constructor(x = 0, y = x, z = x, order = 'YXZ') {
    super(3);
    this.order = order;
    this.onChange = () => {};
    this._target = this;

    this.set(x, y, z);

    // Return a proxy to trigger onChange when array elements are edited directly
    const triggerProps = ['0', '1', '2'];
    return new Proxy(this, {
      set(target, property, value) {
        const success = Reflect.set(target, property, value);
        if (success && triggerProps.includes(property)) target.onChange();
        return success;
      },
    });
  }

  get x() {
    return this[0];
  }

  get y() {
    return this[1];
  }

  get z() {
    return this[2];
  }

  set x(v) {
    this._target[0] = v;
    this.onChange();
  }

  set y(v) {
    this._target[1] = v;
    this.onChange();
  }

  set z(v) {
    this._target[2] = v;
    this.onChange();
  }

  set(x, y, z) {
    if (x.length) return this.copy(x);
    this._target[0] = x;
    this._target[1] = y;
    this._target[2] = z;
    this.onChange();
    return this;
  }

  copy(euler) {
    this._target[0] = euler[0];
    this._target[1] = euler[1];
    this._target[2] = euler[2];
    this.order = euler.order;
    this.onChange();
    return this;
  }

  toRotationMatrix() {
    const matrix = tmpMat4;
    const x = this[0];
    const y = this[1];
    const z = this[2];

    // Reset matrix
    matrix[0] = 1;
    matrix[1] = 0;
    matrix[2] = 0;
    matrix[3] = 0;
    matrix[4] = 0;
    matrix[5] = 1;
    matrix[6] = 0;
    matrix[7] = 0;
    matrix[8] = 0;
    matrix[9] = 0;
    matrix[10] = 1;
    matrix[11] = 0;
    matrix[12] = 0;
    matrix[13] = 0;
    matrix[14] = 0;
    matrix[15] = 1;

    if (this.order === 'XYZ') {
      this.rotateX(matrix, x);
      this.rotateY(matrix, y);
      this.rotateZ(matrix, z);
    } else if (this.order === 'YXZ') {
      this.rotateY(matrix, y);
      this.rotateX(matrix, x);
      this.rotateZ(matrix, z);
    } else if (this.order === 'ZXY') {
      this.rotateZ(matrix, z);
      this.rotateX(matrix, x);
      this.rotateY(matrix, y);
    } else if (this.order === 'ZYX') {
      this.rotateZ(matrix, z);
      this.rotateY(matrix, y);
      this.rotateX(matrix, x);
    } else if (this.order === 'YZX') {
      this.rotateY(matrix, y);
      this.rotateZ(matrix, z);
      this.rotateX(matrix, x);
    } else if (this.order === 'XZY') {
      this.rotateX(matrix, x);
      this.rotateZ(matrix, z);
      this.rotateY(matrix, y);
    }

    return matrix;
  }

  rotateX(matrix, angle) {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const m10 = matrix[4];
    const m11 = matrix[5];
    const m12 = matrix[6];
    const m13 = matrix[7];
    const m20 = matrix[8];
    const m21 = matrix[9];
    const m22 = matrix[10];
    const m23 = matrix[11];

    matrix[4] = m10 * c + m20 * s;
    matrix[5] = m11 * c + m21 * s;
    matrix[6] = m12 * c + m22 * s;
    matrix[7] = m13 * c + m23 * s;
    matrix[8] = m20 * c - m10 * s;
    matrix[9] = m21 * c - m11 * s;
    matrix[10] = m22 * c - m12 * s;
    matrix[11] = m23 * c - m13 * s;
  }

  rotateY(matrix, angle) {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const m00 = matrix[0];
    const m01 = matrix[1];
    const m02 = matrix[2];
    const m03 = matrix[3];
    const m20 = matrix[8];
    const m21 = matrix[9];
    const m22 = matrix[10];
    const m23 = matrix[11];

    matrix[0] = m00 * c - m20 * s;
    matrix[1] = m01 * c - m21 * s;
    matrix[2] = m02 * c - m22 * s;
    matrix[3] = m03 * c - m23 * s;
    matrix[8] = m00 * s + m20 * c;
    matrix[9] = m01 * s + m21 * c;
    matrix[10] = m02 * s + m22 * c;
    matrix[11] = m03 * s + m23 * c;
  }

  rotateZ(matrix, angle) {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const m00 = matrix[0];
    const m01 = matrix[1];
    const m02 = matrix[2];
    const m03 = matrix[3];
    const m10 = matrix[4];
    const m11 = matrix[5];
    const m12 = matrix[6];
    const m13 = matrix[7];

    matrix[0] = m00 * c + m10 * s;
    matrix[1] = m01 * c + m11 * s;
    matrix[2] = m02 * c + m12 * s;
    matrix[3] = m03 * c + m13 * s;
    matrix[4] = m10 * c - m00 * s;
    matrix[5] = m11 * c - m01 * s;
    matrix[6] = m12 * c - m02 * s;
    matrix[7] = m13 * c - m03 * s;
  }

  fromRotationMatrix(m, order = this.order) {
    const out = this;

    if (order === 'XYZ') {
      out[1] = Math.asin(Math.min(Math.max(m[8], -1), 1));
      if (Math.abs(m[8]) < 0.99999) {
        out[0] = Math.atan2(-m[9], m[10]);
        out[2] = Math.atan2(-m[4], m[0]);
      } else {
        out[0] = Math.atan2(m[6], m[5]);
        out[2] = 0;
      }
    } else if (order === 'YXZ') {
      out[0] = Math.asin(-Math.min(Math.max(m[9], -1), 1));
      if (Math.abs(m[9]) < 0.99999) {
        out[1] = Math.atan2(m[8], m[10]);
        out[2] = Math.atan2(m[1], m[5]);
      } else {
        out[1] = Math.atan2(-m[2], m[0]);
        out[2] = 0;
      }
    } else if (order === 'ZXY') {
      out[0] = Math.asin(Math.min(Math.max(m[6], -1), 1));
      if (Math.abs(m[6]) < 0.99999) {
        out[1] = Math.atan2(-m[2], m[10]);
        out[2] = Math.atan2(-m[4], m[5]);
      } else {
        out[1] = 0;
        out[2] = Math.atan2(m[1], m[0]);
      }
    } else if (order === 'ZYX') {
      out[1] = Math.asin(-Math.min(Math.max(m[2], -1), 1));
      if (Math.abs(m[2]) < 0.99999) {
        out[0] = Math.atan2(m[6], m[10]);
        out[2] = Math.atan2(m[1], m[0]);
      } else {
        out[0] = 0;
        out[2] = Math.atan2(-m[4], m[5]);
      }
    } else if (order === 'YZX') {
      out[2] = Math.asin(Math.min(Math.max(m[1], -1), 1));
      if (Math.abs(m[1]) < 0.99999) {
        out[0] = Math.atan2(-m[9], m[5]);
        out[1] = Math.atan2(-m[2], m[0]);
      } else {
        out[0] = 0;
        out[1] = Math.atan2(m[8], m[10]);
      }
    } else if (order === 'XZY') {
      out[2] = Math.asin(-Math.min(Math.max(m[4], -1), 1));
      if (Math.abs(m[4]) < 0.99999) {
        out[0] = Math.atan2(m[6], m[5]);
        out[1] = Math.atan2(m[8], m[0]);
      } else {
        out[0] = Math.atan2(-m[9], m[10]);
        out[1] = 0;
      }
    }
    return this;
  }

  fromQuaternion(q, order = this.order, isInternal) {
    tmpMat4.fromQuaternion(q);
    this.fromRotationMatrix(tmpMat4, order);
    // Avoid infinite recursion
    if (!isInternal) this.onChange();
    return this;
  }

  // Scalar operations
  addScalar(scalar) {
    this[0] += scalar;
    this[1] += scalar;
    this[2] += scalar;
    return this;
  }

  subScalar(scalar) {
    this[0] -= scalar;
    this[1] -= scalar;
    this[2] -= scalar;
    return this;
  }

  multiplyScalar(scalar) {
    this[0] *= scalar;
    this[1] *= scalar;
    this[2] *= scalar;
    return this;
  }

  divideScalar(scalar) {
    this[0] /= scalar;
    this[1] /= scalar;
    this[2] /= scalar;
    return this;
  }

  // Vector operations
  add(euler) {
    this[0] += euler[0];
    this[1] += euler[1];
    this[2] += euler[2];
    return this;
  }

  sub(euler) {
    this[0] -= euler[0];
    this[1] -= euler[1];
    this[2] -= euler[2];
    return this;
  }

  multiply(euler) {
    this[0] *= euler[0];
    this[1] *= euler[1];
    this[2] *= euler[2];
    return this;
  }

  divide(euler) {
    this[0] /= euler[0];
    this[1] /= euler[1];
    this[2] /= euler[2];
    return this;
  }

  clone() {
    return new Euler(this[0], this[1], this[2], this.order);
  }

  reorder(order) {
    this._target.order = order;
    this.onChange();
    return this;
  }

  fromArray(a, o = 0) {
    this._target[0] = a[o];
    this._target[1] = a[o + 1];
    this._target[2] = a[o + 2];
    this.onChange();
    return this;
  }

  toArray(a = [], o = 0) {
    a[o] = this[0];
    a[o + 1] = this[1];
    a[o + 2] = this[2];
    return a;
  }
}
