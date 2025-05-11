export default class Matrix4 extends Float32Array {
	constructor() {
		super(16);
		this.identity();
		return this;
	}

	identity() {
		this[0] = 1;
		this[1] = 0;
		this[2] = 0;
		this[3] = 0;
		this[4] = 0;
		this[5] = 1;
		this[6] = 0;
		this[7] = 0;
		this[8] = 0;
		this[9] = 0;
		this[10] = 1;
		this[11] = 0;
		this[12] = 0;
		this[13] = 0;
		this[14] = 0;
		this[15] = 1;
		return this;
	}

	applyJitter(jx, jy) {
		// Column-major:  data[c*4 + r]
		// Row 0 elements are at [0,4,8,12]; Row 3 at [3,7,11,15]
		this[0] += jx * this[3];
		this[4] += jx * this[7];
		this[8] += jx * this[11];
		this[12] += jx * this[15];
		// Row 1 elements are at [1,5,9,13]
		this[1] += jy * this[3];
		this[5] += jy * this[7];
		this[9] += jy * this[11];
		this[13] += jy * this[15];

		return this;
	}

	copy(m) {
		for (let i = 0; i < 16; i++) {
			this[i] = m[i];
		}
		return this;
	}

	set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {
		this[0] = n11;
		this[1] = n12;
		this[2] = n13;
		this[3] = n14;
		this[4] = n21;
		this[5] = n22;
		this[6] = n23;
		this[7] = n24;
		this[8] = n31;
		this[9] = n32;
		this[10] = n33;
		this[11] = n34;
		this[12] = n41;
		this[13] = n42;
		this[14] = n43;
		this[15] = n44;
		return this;
	}

	multiply(m) {
		let a00 = this[0],
			a01 = this[1],
			a02 = this[2],
			a03 = this[3];
		let a10 = this[4],
			a11 = this[5],
			a12 = this[6],
			a13 = this[7];
		let a20 = this[8],
			a21 = this[9],
			a22 = this[10],
			a23 = this[11];
		let a30 = this[12],
			a31 = this[13],
			a32 = this[14],
			a33 = this[15];

		// Cache only the current line of the second matrix
		let b0 = m[0],
			b1 = m[1],
			b2 = m[2],
			b3 = m[3];
		this[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
		this[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
		this[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
		this[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

		b0 = m[4];
		b1 = m[5];
		b2 = m[6];
		b3 = m[7];
		this[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
		this[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
		this[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
		this[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

		b0 = m[8];
		b1 = m[9];
		b2 = m[10];
		b3 = m[11];
		this[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
		this[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
		this[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
		this[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

		b0 = m[12];
		b1 = m[13];
		b2 = m[14];
		b3 = m[15];
		this[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
		this[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
		this[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
		this[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
		return this;
	}

	multiplyMatrices(ma, mb) {
		let a00 = ma[0],
			a01 = ma[1],
			a02 = ma[2],
			a03 = ma[3];
		let a10 = ma[4],
			a11 = ma[5],
			a12 = ma[6],
			a13 = ma[7];
		let a20 = ma[8],
			a21 = ma[9],
			a22 = ma[10],
			a23 = ma[11];
		let a30 = ma[12],
			a31 = ma[13],
			a32 = ma[14],
			a33 = ma[15];

		// Cache only the current line of the second matrix
		let b0 = mb[0],
			b1 = mb[1],
			b2 = mb[2],
			b3 = mb[3];
		this[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
		this[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
		this[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
		this[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

		b0 = mb[4];
		b1 = mb[5];
		b2 = mb[6];
		b3 = mb[7];
		this[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
		this[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
		this[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
		this[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

		b0 = mb[8];
		b1 = mb[9];
		b2 = mb[10];
		b3 = mb[11];
		this[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
		this[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
		this[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
		this[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

		b0 = mb[12];
		b1 = mb[13];
		b2 = mb[14];
		b3 = mb[15];
		this[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
		this[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
		this[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
		this[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
		return this;
	}

	multiplyScalar(s) {
		for (let i = 0; i < 16; i++) {
			this[i] *= s;
		}
		return this;
	}

	determinant() {
		let a00 = this[0],
			a01 = this[1],
			a02 = this[2],
			a03 = this[3];
		let a10 = this[4],
			a11 = this[5],
			a12 = this[6],
			a13 = this[7];
		let a20 = this[8],
			a21 = this[9],
			a22 = this[10],
			a23 = this[11];
		let a30 = this[12],
			a31 = this[13],
			a32 = this[14],
			a33 = this[15];

		let b00 = a00 * a11 - a01 * a10;
		let b01 = a00 * a12 - a02 * a10;
		let b02 = a00 * a13 - a03 * a10;
		let b03 = a01 * a12 - a02 * a11;
		let b04 = a01 * a13 - a03 * a11;
		let b05 = a02 * a13 - a03 * a12;
		let b06 = a20 * a31 - a21 * a30;
		let b07 = a20 * a32 - a22 * a30;
		let b08 = a20 * a33 - a23 * a30;
		let b09 = a21 * a32 - a22 * a31;
		let b10 = a21 * a33 - a23 * a31;
		let b11 = a22 * a33 - a23 * a32;

		// Calculate the determinant
		return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
	}

	getInverse(matrix, throwOnDegenerate = false) {
		let a00 = matrix[0],
			a01 = matrix[1],
			a02 = matrix[2],
			a03 = matrix[3];
		let a10 = matrix[4],
			a11 = matrix[5],
			a12 = matrix[6],
			a13 = matrix[7];
		let a20 = matrix[8],
			a21 = matrix[9],
			a22 = matrix[10],
			a23 = matrix[11];
		let a30 = matrix[12],
			a31 = matrix[13],
			a32 = matrix[14],
			a33 = matrix[15];

		let b00 = a00 * a11 - a01 * a10;
		let b01 = a00 * a12 - a02 * a10;
		let b02 = a00 * a13 - a03 * a10;
		let b03 = a01 * a12 - a02 * a11;
		let b04 = a01 * a13 - a03 * a11;
		let b05 = a02 * a13 - a03 * a12;
		let b06 = a20 * a31 - a21 * a30;
		let b07 = a20 * a32 - a22 * a30;
		let b08 = a20 * a33 - a23 * a30;
		let b09 = a21 * a32 - a22 * a31;
		let b10 = a21 * a33 - a23 * a31;
		let b11 = a22 * a33 - a23 * a32;

		// Calculate the determinant
		let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

		if (!det) {
			if (throwOnDegenerate) {
				throw new Error("Matrix4.getInverse(): can't invert matrix, determinant is 0");
			}
			return this.identity();
		}
		det = 1.0 / det;

		this[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
		this[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
		this[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
		this[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
		this[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
		this[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
		this[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
		this[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
		this[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
		this[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
		this[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
		this[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
		this[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
		this[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
		this[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
		this[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

		return this;
	}

	inversePerspective(fovy, aspect, near, far) {
		const f = 1.0 / Math.tan(fovy * 0.5);
		const nf = 1.0 / (near - far);

		this[0] = aspect / f;
		this[1] = 0;
		this[2] = 0;
		this[3] = 0;

		this[4] = 0;
		this[5] = 1.0 / f;
		this[6] = 0;
		this[7] = 0;

		this[8] = 0;
		this[9] = 0;
		this[10] = 0;
		this[11] = 1.0;

		this[12] = 0;
		this[13] = 0;
		this[14] = (near - far) / (2.0 * near * far);
		this[15] = (far + near) / (2.0 * near * far);

		return this;
	}

	transpose() {
		let tmp;
		tmp = this[1];
		this[1] = this[4];
		this[4] = tmp;
		tmp = this[2];
		this[2] = this[8];
		this[8] = tmp;
		tmp = this[3];
		this[3] = this[12];
		this[12] = tmp;
		tmp = this[6];
		this[6] = this[9];
		this[9] = tmp;
		tmp = this[7];
		this[7] = this[13];
		this[13] = tmp;
		tmp = this[11];
		this[11] = this[14];
		this[14] = tmp;
		return this;
	}

	setPosition(x, y, z) {
		this[12] = x;
		this[13] = y;
		this[14] = z;
		return this;
	}

	makeRotationX(theta) {
		const c = Math.cos(theta);
		const s = Math.sin(theta);

		this[0] = 1;
		this[4] = 0;
		this[8] = 0;
		this[12] = 0;
		this[1] = 0;
		this[5] = c;
		this[9] = -s;
		this[13] = 0;
		this[2] = 0;
		this[6] = s;
		this[10] = c;
		this[14] = 0;
		this[3] = 0;
		this[7] = 0;
		this[11] = 0;
		this[15] = 1;

		return this;
	}

	makeRotationY(theta) {
		const c = Math.cos(theta);
		const s = Math.sin(theta);

		this[0] = c;
		this[4] = 0;
		this[8] = s;
		this[12] = 0;
		this[1] = 0;
		this[5] = 1;
		this[9] = 0;
		this[13] = 0;
		this[2] = -s;
		this[6] = 0;
		this[10] = c;
		this[14] = 0;
		this[3] = 0;
		this[7] = 0;
		this[11] = 0;
		this[15] = 1;

		return this;
	}

	makeRotationZ(theta) {
		const c = Math.cos(theta);
		const s = Math.sin(theta);

		this[0] = c;
		this[4] = -s;
		this[8] = 0;
		this[12] = 0;
		this[1] = s;
		this[5] = c;
		this[9] = 0;
		this[13] = 0;
		this[2] = 0;
		this[6] = 0;
		this[10] = 1;
		this[14] = 0;
		this[3] = 0;
		this[7] = 0;
		this[11] = 0;
		this[15] = 1;

		return this;
	}

	makeScale(x, y, z) {
		this[0] = x;
		this[4] = 0;
		this[8] = 0;
		this[12] = 0;
		this[1] = 0;
		this[5] = y;
		this[9] = 0;
		this[13] = 0;
		this[2] = 0;
		this[6] = 0;
		this[10] = z;
		this[14] = 0;
		this[3] = 0;
		this[7] = 0;
		this[11] = 0;
		this[15] = 1;

		return this;
	}

	makePerspective(left, right, top, bottom, near, far) {
		const x = (2 * near) / (right - left);
		const y = (2 * near) / (top - bottom);

		const a = (right + left) / (right - left);
		const b = (top + bottom) / (top - bottom);
		const c = -(far + near) / (far - near);
		const d = (-2 * far * near) / (far - near);

		this[0] = x;
		this[1] = 0;
		this[2] = 0;
		this[3] = 0;
		this[4] = 0;
		this[5] = y;
		this[6] = 0;
		this[7] = 0;
		this[8] = a;
		this[9] = b;
		this[10] = c;
		this[11] = -1;
		this[12] = 0;
		this[13] = 0;
		this[14] = d;
		this[15] = 0;

		return this;
	}

	makeOrthographic(left, right, top, bottom, near, far) {
		const lr = 1 / (left - right);
		const bt = 1 / (bottom - top);
		const nf = 1 / (near - far);

		this[0] = -2 * lr;
		this[1] = 0;
		this[2] = 0;
		this[3] = 0;
		this[4] = 0;
		this[5] = -2 * bt;
		this[6] = 0;
		this[7] = 0;
		this[8] = 0;
		this[9] = 0;
		this[10] = 2 * nf;
		this[11] = 0;
		this[12] = (left + right) * lr;
		this[13] = (top + bottom) * bt;
		this[14] = (far + near) * nf;
		this[15] = 1;

		return this;
	}

	// Array operations
	fromArray(array, offset = 0) {
		for (let i = 0; i < 16; i++) {
			this[i] = array[i + offset];
		}
		return this;
	}

	toArray(array = [], offset = 0) {
		for (let i = 0; i < 16; i++) {
			array[i + offset] = this[i];
		}
		return array;
	}

	clone() {
		return new Matrix4().copy(this);
	}

	compose(position, quaternion, scale) {
		const x = quaternion[0],
			y = quaternion[1],
			z = quaternion[2],
			w = quaternion[3];
		const x2 = x + x,
			y2 = y + y,
			z2 = z + z;
		const xx = x * x2,
			xy = x * y2,
			xz = x * z2;
		const yy = y * y2,
			yz = y * z2,
			zz = z * z2;
		const wx = w * x2,
			wy = w * y2,
			wz = w * z2;

		const sx = scale[0],
			sy = scale[1],
			sz = scale[2];

		this[0] = (1 - (yy + zz)) * sx;
		this[1] = (xy + wz) * sx;
		this[2] = (xz - wy) * sx;
		this[3] = 0;

		this[4] = (xy - wz) * sy;
		this[5] = (1 - (xx + zz)) * sy;
		this[6] = (yz + wx) * sy;
		this[7] = 0;

		this[8] = (xz + wy) * sz;
		this[9] = (yz - wx) * sz;
		this[10] = (1 - (xx + yy)) * sz;
		this[11] = 0;

		this[12] = position[0];
		this[13] = position[1];
		this[14] = position[2];
		this[15] = 1;

		return this;
	}

	inverse(m = this) {
		const n11 = m[0],
			n21 = m[1],
			n31 = m[2],
			n41 = m[3];
		const n12 = m[4],
			n22 = m[5],
			n32 = m[6],
			n42 = m[7];
		const n13 = m[8],
			n23 = m[9],
			n33 = m[10],
			n43 = m[11];
		const n14 = m[12],
			n24 = m[13],
			n34 = m[14],
			n44 = m[15];

		const t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
		const t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
		const t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
		const t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

		const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

		if (det === 0) {
			return null;
		}

		const detInv = 1.0 / det;

		this[0] = t11 * detInv;
		this[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv;
		this[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv;
		this[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv;

		this[4] = t12 * detInv;
		this[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv;
		this[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv;
		this[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv;

		this[8] = t13 * detInv;
		this[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv;
		this[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv;
		this[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv;

		this[12] = t14 * detInv;
		this[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv;
		this[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv;
		this[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv;

		return this;
	}

	getMaxScaleOnAxis() {
		const scaleXSq = this[0] * this[0] + this[1] * this[1] + this[2] * this[2];
		const scaleYSq = this[4] * this[4] + this[5] * this[5] + this[6] * this[6];
		const scaleZSq = this[8] * this[8] + this[9] * this[9] + this[10] * this[10];
		return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));
	}

	lookAt(eye, target, up) {
		let eyex = eye[0],
			eyey = eye[1],
			eyez = eye[2],
			upx = up[0],
			upy = up[1],
			upz = up[2];

		let z0 = eyex - target[0],
			z1 = eyey - target[1],
			z2 = eyez - target[2];

		let len = z0 * z0 + z1 * z1 + z2 * z2;
		if (len === 0) {
			// eye and target are in the same position
			z2 = 1;
		} else {
			len = 1 / Math.sqrt(len);
			z0 *= len;
			z1 *= len;
			z2 *= len;
		}

		let x0 = upy * z2 - upz * z1,
			x1 = upz * z0 - upx * z2,
			x2 = upx * z1 - upy * z0;

		len = x0 * x0 + x1 * x1 + x2 * x2;
		if (len === 0) {
			// up and z are parallel
			if (upz) {
				upx += 1e-6;
			} else if (upy) {
				upz += 1e-6;
			} else {
				upy += 1e-6;
			}
			(x0 = upy * z2 - upz * z1), (x1 = upz * z0 - upx * z2), (x2 = upx * z1 - upy * z0);

			len = x0 * x0 + x1 * x1 + x2 * x2;
		}

		len = 1 / Math.sqrt(len);
		x0 *= len;
		x1 *= len;
		x2 *= len;

		this[0] = x0;
		this[1] = x1;
		this[2] = x2;
		this[3] = 0;
		this[4] = z1 * x2 - z2 * x1;
		this[5] = z2 * x0 - z0 * x2;
		this[6] = z0 * x1 - z1 * x0;
		this[7] = 0;
		this[8] = z0;
		this[9] = z1;
		this[10] = z2;
		this[11] = 0;
		this[12] = eyex;
		this[13] = eyey;
		this[14] = eyez;
		this[15] = 1;
		return this;
	}

	getRotation(q) {
		const scaling = [1, 1, 1];

		// Get scaling factors
		const sx = Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2]);
		const sy = Math.sqrt(this[4] * this[4] + this[5] * this[5] + this[6] * this[6]);
		const sz = Math.sqrt(this[8] * this[8] + this[9] * this[9] + this[10] * this[10]);

		// If determinant is negative, we need to invert one scale
		const det = this.determinant();
		if (det < 0) scaling[0] = -1;

		const is1 = 1 / sx;
		const is2 = 1 / sy;
		const is3 = 1 / sz;

		const sm11 = this[0] * is1;
		const sm12 = this[1] * is2;
		const sm13 = this[2] * is3;
		const sm21 = this[4] * is1;
		const sm22 = this[5] * is2;
		const sm23 = this[6] * is3;
		const sm31 = this[8] * is1;
		const sm32 = this[9] * is2;
		const sm33 = this[10] * is3;

		const trace = sm11 + sm22 + sm33;
		let S = 0;

		if (trace > 0) {
			S = Math.sqrt(trace + 1.0) * 2;
			q[3] = 0.25 * S;
			q[0] = (sm23 - sm32) / S;
			q[1] = (sm31 - sm13) / S;
			q[2] = (sm12 - sm21) / S;
		} else if (sm11 > sm22 && sm11 > sm33) {
			S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
			q[3] = (sm23 - sm32) / S;
			q[0] = 0.25 * S;
			q[1] = (sm12 + sm21) / S;
			q[2] = (sm31 + sm13) / S;
		} else if (sm22 > sm33) {
			S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
			q[3] = (sm31 - sm13) / S;
			q[0] = (sm12 + sm21) / S;
			q[1] = 0.25 * S;
			q[2] = (sm23 + sm32) / S;
		} else {
			S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
			q[3] = (sm12 - sm21) / S;
			q[0] = (sm31 + sm13) / S;
			q[1] = (sm23 + sm32) / S;
			q[2] = 0.25 * S;
		}

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
		this[1] = yx + wz;
		this[2] = zx - wy;
		this[3] = 0;

		this[4] = yx - wz;
		this[5] = 1 - xx - zz;
		this[6] = zy + wx;
		this[7] = 0;

		this[8] = zx + wy;
		this[9] = zy - wx;
		this[10] = 1 - xx - yy;
		this[11] = 0;

		this[12] = 0;
		this[13] = 0;
		this[14] = 0;
		this[15] = 1;

		return this;
	}
}
