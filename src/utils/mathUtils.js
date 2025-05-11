class MathUtils {
  PI = Math.PI;
  PI2 = this.PI * 2;
  HALF_PI = this.PI * 0.5;
  DEG2RAD = this.PI / 180.0;
  RAD2DEG = 180.0 / this.PI;

  clamp(val, min, max) {
    return val < min ? min : val > max ? max : val;
  }

  mix(min, max, ratio) {
    return min + (max - min) * ratio;
  }

  cUnMix(min, max, val) {
    return this.clamp((val - min) / (max - min), 0, 1);
  }

  saturate(val) {
    return this.clamp(val, 0, 1);
  }

  fit(val, min, max, toMin, toMax) {
    val = this.cUnMix(min, max, val);
    return toMin + val * (toMax - toMin);
  }
}

export default new MathUtils();
