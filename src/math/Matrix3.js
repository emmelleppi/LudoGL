export default class Matrix3 extends Float32Array {
  constructor() {
    super(9);
    this.identity();
    return this;
  }

  identity() {
    this[0] = 1;
    this[1] = 0;
    this[2] = 0;
    this[3] = 0;
    this[4] = 1;
    this[5] = 0;
    this[6] = 0;
    this[7] = 0;
    this[8] = 1;
    return this;
  }

  copy(m) {
    for (let i = 0; i < 9; i++) {
      this[i] = m[i];
    }
    return this;
  }

  set(n11, n12, n13, n21, n22, n23, n31, n32, n33) {
    this[0] = n11;
    this[1] = n21;
    this[2] = n31;
    this[3] = n12;
    this[4] = n22;
    this[5] = n32;
    this[6] = n13;
    this[7] = n23;
    this[8] = n33;
    return this;
  }

  multiply(m) {
    const a11 = this[0],
      a12 = this[3],
      a13 = this[6];
    const a21 = this[1],
      a22 = this[4],
      a23 = this[7];
    const a31 = this[2],
      a32 = this[5],
      a33 = this[8];

    const b11 = m[0],
      b12 = m[3],
      b13 = m[6];
    const b21 = m[1],
      b22 = m[4],
      b23 = m[7];
    const b31 = m[2],
      b32 = m[5],
      b33 = m[8];

    this[0] = a11 * b11 + a12 * b21 + a13 * b31;
    this[3] = a11 * b12 + a12 * b22 + a13 * b32;
    this[6] = a11 * b13 + a12 * b23 + a13 * b33;

    this[1] = a21 * b11 + a22 * b21 + a23 * b31;
    this[4] = a21 * b12 + a22 * b22 + a23 * b32;
    this[7] = a21 * b13 + a22 * b23 + a23 * b33;

    this[2] = a31 * b11 + a32 * b21 + a33 * b31;
    this[5] = a31 * b12 + a32 * b22 + a33 * b32;
    this[8] = a31 * b13 + a32 * b23 + a33 * b33;

    return this;
  }

  multiplyScalar(s) {
    for (let i = 0; i < 9; i++) {
      this[i] *= s;
    }
    return this;
  }

  multiplyScalarMatrix(m, s) {
    this[0] = m[0] * s;
    this[1] = m[1] * s;
    this[2] = m[2] * s;
    this[3] = m[3] * s;
    this[4] = m[4] * s;
    this[5] = m[5] * s;
    this[6] = m[6] * s;
    this[7] = m[7] * s;
    this[8] = m[8] * s;
    return this;
  }

  determinant() {
    const a = this[0],
      b = this[1],
      c = this[2];
    const d = this[3],
      e = this[4],
      f = this[5];
    const g = this[6],
      h = this[7],
      i = this[8];

    return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;
  }

  getInverse(matrix, throwOnDegenerate = false) {
    const n11 = matrix[0],
      n21 = matrix[1],
      n31 = matrix[2];
    const n12 = matrix[3],
      n22 = matrix[4],
      n32 = matrix[5];
    const n13 = matrix[6],
      n23 = matrix[7],
      n33 = matrix[8];

    const t11 = n33 * n22 - n32 * n23;
    const t12 = n32 * n13 - n33 * n12;
    const t13 = n23 * n12 - n22 * n13;

    const det = n11 * t11 + n21 * t12 + n31 * t13;

    if (det === 0) {
      if (throwOnDegenerate) {
        throw new Error("Matrix3.getInverse(): can't invert matrix, determinant is 0");
      }
      return this.identity();
    }

    const detInv = 1 / det;

    this[0] = t11 * detInv;
    this[1] = (n31 * n23 - n33 * n21) * detInv;
    this[2] = (n32 * n21 - n31 * n22) * detInv;

    this[3] = t12 * detInv;
    this[4] = (n33 * n11 - n31 * n13) * detInv;
    this[5] = (n31 * n12 - n32 * n11) * detInv;

    this[6] = t13 * detInv;
    this[7] = (n21 * n13 - n23 * n11) * detInv;
    this[8] = (n22 * n11 - n21 * n12) * detInv;

    return this;
  }

  transpose() {
    let tmp;
    tmp = this[1];
    this[1] = this[3];
    this[3] = tmp;
    tmp = this[2];
    this[2] = this[6];
    this[6] = tmp;
    tmp = this[5];
    this[5] = this[7];
    this[7] = tmp;
    return this;
  }

  transposeMatrix(m) {
    if (m === this) {
      let tmp;
      tmp = m[1];
      m[1] = m[3];
      m[3] = tmp;
      tmp = m[2];
      m[2] = m[6];
      m[6] = tmp;
      tmp = m[5];
      m[5] = m[7];
      m[7] = tmp;
    } else {
      this[0] = m[0];
      this[1] = m[3];
      this[2] = m[6];
      this[3] = m[1];
      this[4] = m[4];
      this[5] = m[7];
      this[6] = m[2];
      this[7] = m[5];
      this[8] = m[8];
    }
    return this;
  }

  getNormalMatrix(matrix4) {
    return this.setFromMatrix4(matrix4).getInverse(this).transpose();
  }

  setFromMatrix4(m) {
    const me = m;

    this[0] = me[0];
    this[1] = me[1];
    this[2] = me[2];
    this[3] = me[4];
    this[4] = me[5];
    this[5] = me[6];
    this[6] = me[8];
    this[7] = me[9];
    this[8] = me[10];

    return this;
  }

  // Array operations
  fromArray(array, offset = 0) {
    for (let i = 0; i < 9; i++) {
      this[i] = array[i + offset];
    }
    return this;
  }

  toArray(array = [], offset = 0) {
    for (let i = 0; i < 9; i++) {
      array[i + offset] = this[i];
    }
    return array;
  }

  clone() {
    return new Matrix3().copy(this);
  }

  translate(v, m = this) {
    const x = v[0],
      y = v[1];
    const a00 = m[0],
      a01 = m[1],
      a02 = m[2];
    const a10 = m[3],
      a11 = m[4],
      a12 = m[5];
    const a20 = m[6],
      a21 = m[7],
      a22 = m[8];

    this[0] = a00;
    this[1] = a01;
    this[2] = a02;
    this[3] = a10;
    this[4] = a11;
    this[5] = a12;
    this[6] = x * a00 + y * a10 + a20;
    this[7] = x * a01 + y * a11 + a21;
    this[8] = x * a02 + y * a12 + a22;

    return this;
  }

  rotate(rad, m = this) {
    const s = Math.sin(rad);
    const c = Math.cos(rad);
    const a00 = m[0],
      a01 = m[1],
      a02 = m[2];
    const a10 = m[3],
      a11 = m[4],
      a12 = m[5];
    const a20 = m[6],
      a21 = m[7],
      a22 = m[8];

    this[0] = c * a00 + s * a10;
    this[1] = c * a01 + s * a11;
    this[2] = c * a02 + s * a12;
    this[3] = c * a10 - s * a00;
    this[4] = c * a11 - s * a01;
    this[5] = c * a12 - s * a02;
    this[6] = a20;
    this[7] = a21;
    this[8] = a22;

    return this;
  }

  scale(v, m = this) {
    const x = v[0],
      y = v[1];
    const a00 = m[0],
      a01 = m[1],
      a02 = m[2];
    const a10 = m[3],
      a11 = m[4],
      a12 = m[5];
    const a20 = m[6],
      a21 = m[7],
      a22 = m[8];

    this[0] = x * a00;
    this[1] = x * a01;
    this[2] = x * a02;
    this[3] = y * a10;
    this[4] = y * a11;
    this[5] = y * a12;
    this[6] = a20;
    this[7] = a21;
    this[8] = a22;

    return this;
  }

  fromQuaternion(q) {
    const x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;

    const xx = x * x2;
    const yx = y * x2;
    const yy = y * y2;
    const zx = z * x2;
    const zy = z * y2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;

    this[0] = 1 - yy - zz;
    this[3] = yx - wz;
    this[6] = zx + wy;

    this[1] = yx + wz;
    this[4] = 1 - xx - zz;
    this[7] = zy - wx;

    this[2] = zx - wy;
    this[5] = zy + wx;
    this[8] = 1 - xx - yy;

    return this;
  }

  fromBasis(vec3a, vec3b, vec3c) {
    this.set(
      vec3a[0],
      vec3a[1],
      vec3a[2],
      vec3b[0],
      vec3b[1],
      vec3b[2],
      vec3c[0],
      vec3c[1],
      vec3c[2]
    );
    return this;
  }

  projection(width, height) {
    this[0] = 2 / width;
    this[1] = 0;
    this[2] = 0;
    this[3] = 0;
    this[4] = -2 / height;
    this[5] = 0;
    this[6] = -1;
    this[7] = 1;
    this[8] = 1;
    return this;
  }

  add(m) {
    this[0] += m[0];
    this[1] += m[1];
    this[2] += m[2];
    this[3] += m[3];
    this[4] += m[4];
    this[5] += m[5];
    this[6] += m[6];
    this[7] += m[7];
    this[8] += m[8];
    return this;
  }

  subtract(m) {
    this[0] -= m[0];
    this[1] -= m[1];
    this[2] -= m[2];
    this[3] -= m[3];
    this[4] -= m[4];
    this[5] -= m[5];
    this[6] -= m[6];
    this[7] -= m[7];
    this[8] -= m[8];
    return this;
  }

  multiplyMatrices(ma, mb) {
    const a11 = ma[0],
      a12 = ma[3],
      a13 = ma[6];
    const a21 = ma[1],
      a22 = ma[4],
      a23 = ma[7];
    const a31 = ma[2],
      a32 = ma[5],
      a33 = ma[8];

    const b11 = mb[0],
      b12 = mb[3],
      b13 = mb[6];
    const b21 = mb[1],
      b22 = mb[4],
      b23 = mb[7];
    const b31 = mb[2],
      b32 = mb[5],
      b33 = mb[8];

    this[0] = a11 * b11 + a12 * b21 + a13 * b31;
    this[3] = a11 * b12 + a12 * b22 + a13 * b32;
    this[6] = a11 * b13 + a12 * b23 + a13 * b33;

    this[1] = a21 * b11 + a22 * b21 + a23 * b31;
    this[4] = a21 * b12 + a22 * b22 + a23 * b32;
    this[7] = a21 * b13 + a22 * b23 + a23 * b33;

    this[2] = a31 * b11 + a32 * b21 + a33 * b31;
    this[5] = a31 * b12 + a32 * b22 + a33 * b32;
    this[8] = a31 * b13 + a32 * b23 + a33 * b33;

    return this;
  }

  inverse(m = this) {
    const a00 = m[0],
      a01 = m[1],
      a02 = m[2];
    const a10 = m[3],
      a11 = m[4],
      a12 = m[5];
    const a20 = m[6],
      a21 = m[7],
      a22 = m[8];

    const b01 = a22 * a11 - a12 * a21;
    const b11 = -a22 * a10 + a12 * a20;
    const b21 = a21 * a10 - a11 * a20;

    const det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) {
      return null;
    }
    const detInv = 1.0 / det;

    this[0] = b01 * detInv;
    this[1] = (-a22 * a01 + a02 * a21) * detInv;
    this[2] = (a12 * a01 - a02 * a11) * detInv;
    this[3] = b11 * detInv;
    this[4] = (a22 * a00 - a02 * a20) * detInv;
    this[5] = (-a12 * a00 + a02 * a10) * detInv;
    this[6] = b21 * detInv;
    this[7] = (-a21 * a00 + a01 * a20) * detInv;
    this[8] = (a11 * a00 - a01 * a10) * detInv;

    return this;
  }

  equals(m) {
    return (
      this[0] === m[0] &&
      this[1] === m[1] &&
      this[2] === m[2] &&
      this[3] === m[3] &&
      this[4] === m[4] &&
      this[5] === m[5] &&
      this[6] === m[6] &&
      this[7] === m[7] &&
      this[8] === m[8]
    );
  }

  fromMatrix4(m) {
    this[0] = m[0];
    this[1] = m[1];
    this[2] = m[2];
    this[3] = m[4];
    this[4] = m[5];
    this[5] = m[6];
    this[6] = m[8];
    this[7] = m[9];
    this[8] = m[10];
    return this;
  }
}
