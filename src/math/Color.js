import mathUtils from '@utils/mathUtils';

export default class Color extends Float32Array {
  constructor(r = 0, g = 0, b = 0, a = 1) {
    super(4);
    this.set(r, g, b, a);
    return this;
  }

  set(r, g, b, a = 1) {
    this[0] = r;
    this[1] = g;
    this[2] = b;
    this[3] = a;
    return this;
  }

  copy(color) {
    this[0] = color[0];
    this[1] = color[1];
    this[2] = color[2];
    this[3] = color[3];
    return this;
  }

  // Scalar operations
  addScalar(scalar) {
    this[0] += scalar;
    this[1] += scalar;
    this[2] += scalar;
    return this;
  }

  multiplyScalar(scalar) {
    this[0] *= scalar;
    this[1] *= scalar;
    this[2] *= scalar;
    return this;
  }

  // Vector operations
  add(color) {
    this[0] += color[0];
    this[1] += color[1];
    this[2] += color[2];
    return this;
  }

  multiply(color) {
    this[0] *= color[0];
    this[1] *= color[1];
    this[2] *= color[2];
    return this;
  }

  lerp(color, t) {
    this[0] += (color[0] - this[0]) * t;
    this[1] += (color[1] - this[1]) * t;
    this[2] += (color[2] - this[2]) * t;
    return this;
  }

  // Array operations
  fromArray(array, offset = 0) {
    this[0] = array[offset];
    this[1] = array[offset + 1];
    this[2] = array[offset + 2];
    this[3] = array[offset + 3];
    return this;
  }

  toArray(array = [], offset = 0) {
    array[offset] = this[0];
    array[offset + 1] = this[1];
    array[offset + 2] = this[2];
    array[offset + 3] = this[3];
    return array;
  }

  // Getters and setters
  get r() {
    return this[0];
  }

  set r(value) {
    this[0] = value;
  }

  get g() {
    return this[1];
  }

  set g(value) {
    this[1] = value;
  }

  get b() {
    return this[2];
  }

  set b(value) {
    this[2] = value;
  }

  get a() {
    return this[3];
  }

  set a(value) {
    this[3] = value;
  }

  clone() {
    return new Color(this[0], this[1], this[2], this[3]);
  }

  setRGB(r, g, b) {
    this[0] = r;
    this[1] = g;
    this[2] = b;
    return this;
  }

  setHex(hex) {
    hex = Math.floor(hex);

    this[0] = ((hex >> 16) & 255) / 255;
    this[1] = ((hex >> 8) & 255) / 255;
    this[2] = (hex & 255) / 255;

    return this;
  }

  getHex() {
    return (
      Math.round(mathUtils.clamp(this[0] * 255, 0, 255)) * 65536 +
      Math.round(mathUtils.clamp(this[1] * 255, 0, 255)) * 256 +
      Math.round(mathUtils.clamp(this[2] * 255, 0, 255))
    );
  }

  getHexString() {
    return ('000000' + this.getHex().toString(16)).slice(-6);
  }

  setStyle(style) {
    let m;

    if ((m = /^((?:rgb|hsl)a?)\(([^\)]*)\)/.exec(style))) {
      // rgb / rgba
      let color;
      const name = m[1];
      const components = m[2];

      switch (name) {
        case 'rgb':
        case 'rgba':
          if ((color = /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(components))) {
            // rgb(255,0,0) rgba(255,0,0,0.5)
            this[0] = Math.min(255, parseInt(color[1], 10)) / 255;
            this[1] = Math.min(255, parseInt(color[2], 10)) / 255;
            this[2] = Math.min(255, parseInt(color[3], 10)) / 255;
            return this;
          }

          if ((color = /(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%/.exec(components))) {
            // rgb(100%,0%,0%) rgba(100%,0%,0%,0.5)
            this[0] = Math.min(100, parseInt(color[1], 10)) / 100;
            this[1] = Math.min(100, parseInt(color[2], 10)) / 100;
            this[2] = Math.min(100, parseInt(color[3], 10)) / 100;
            return this;
          }
          break;
      }
    } else if ((m = /^\#([A-Fa-f0-9]+)$/.exec(style))) {
      // hex color
      const hex = m[1];
      const size = hex.length;

      if (size === 3) {
        // #ff0
        this[0] = parseInt(hex.charAt(0) + hex.charAt(0), 16) / 255;
        this[1] = parseInt(hex.charAt(1) + hex.charAt(1), 16) / 255;
        this[2] = parseInt(hex.charAt(2) + hex.charAt(2), 16) / 255;

        return this;
      } else if (size === 6) {
        // #ff0000
        this[0] = parseInt(hex.substring(0, 2), 16) / 255;
        this[1] = parseInt(hex.substring(2, 4), 16) / 255;
        this[2] = parseInt(hex.substring(4, 6), 16) / 255;

        return this;
      }
    }

    return this;
  }

  luma() {
    return this[0] * 0.299 + this[1] * 0.587 + this[2] * 0.114;
  }

  addColor(color) {
    this[0] += color[0];
    this[1] += color[1];
    this[2] += color[2];

    return this;
  }

  addScaledColor(color, scale) {
    this[0] += color[0] * scale;
    this[1] += color[1] * scale;
    this[2] += color[2] * scale;

    return this;
  }

  multiplyScaledColor(color, scale) {
    this[0] *= color[0] * scale;
    this[1] *= color[1] * scale;
    this[2] *= color[2] * scale;

    return this;
  }

  toString() {
    return `rgb(${Math.floor(this[0] * 255)}, ${Math.floor(this[1] * 255)}, ${Math.floor(
      this[2] * 255
    )})`;
  }
}

export function hslToRgb(h, s, l) {
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = r + m;
  g = g + m;
  b = b + m;

  return [r, g, b];
}
