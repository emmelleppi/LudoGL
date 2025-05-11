
// —————————————————————————————————
//  BIT CONFIGURATION
//  • 1 bit  → sign  = shadow
//  • 6 bits → roughness (64 levels)
//  • 4 bits → bloom     (16 levels)
//  Total mantissa used: 6 + 4 = 10 bits
//  Fixed exponent bits with bias=14 (=> range [0.5,1))
// —————————————————————————————————

// Pack: all inputs are float in [0,1]
float packData(float roughness, float bloom, float shadow)
{
    // clamp + quantize to chosen levels
    uint r6 = uint(clamp(roughness, 0.0, 1.0) * 63.0 + 0.5);  // 0..63
    uint b4 = uint(clamp(bloom,     0.0, 1.0) * 15.0 + 0.5);  // 0..15

    // create 10-bit mantissa field
    uint mant = (r6 << 4) | b4;   // bits[9..4]=r6, bits[3..0]=b4

    // build "idealized" half-float value:
    //   value = (1 + mant/2^10) * 2^(E−bias)
    // with E−bias = -1  ⇒ 2^(−1) = 0.5
    float mag = 0.5 + float(mant) / 2048.0;

    // apply sign for shadow
    return (shadow >= 0.5) ? -mag : mag;
}

// Unpack: returns roughness,bloom,shadow as floats (0.0/1.0)
void unpackData(float packed, out float roughness, out float bloom, out float shadow)
{
    // extract shadow bit from sign
    bool s = (packed < 0.0);

    // absolute part falls in [0.5, ~0.9995]
    float a = abs(packed);

    // recover mantissa field: mant = round((a−0.5)*2^11)
    // (2^11 because (a−0.5)*2048 = mant)
    uint mant = uint((a - 0.5) * 2048.0 + 0.5);

    // split mantissa into r6 and b4
    uint r6 = (mant >> 4) & 0x3Fu;  // 6 bits
    uint b4 =  mant        & 0xFu;  // 4 bits

    // convert back to floats [0,1]
    roughness = float(r6) / 63.0;
    bloom     = float(b4) / 15.0;
    shadow    = s ? 1.0 : 0.0;
}

vec3 viewPositionFromDepth(float viewZ, vec2 uv, mat4 inverseProjectionMatrix) {
  vec2 ndc = uv * 2.0 - 1.0;
  vec4 clipPos = vec4(ndc, -1.0, 1.0);
  vec4 viewPos4 = inverseProjectionMatrix * clipPos;
  viewPos4 /= viewPos4.w;
  vec3 viewDir = normalize(viewPos4.xyz);
  vec3 viewPos = viewDir * viewZ;
  return viewPos;
}

vec3 worldPositionFromDepth(float viewZ, vec2 uv, mat4 inverseProjectionMatrix, mat4 inverseViewMatrix) {
  vec3 viewPos = viewPositionFromDepth(viewZ, uv, inverseProjectionMatrix);
  vec4 worldPos = inverseViewMatrix * vec4(viewPos, 1.0);
  return worldPos.xyz;
}

float linearizeDepth(float d, float near, float far) {
    // from [0,1] → NDC z ∈ [-1,1]
    float z_ndc = d * 2.0 - 1.0;
    // inverse of perspective projection formula
    return (2.0 * near * far) / (far + near - z_ndc * (far - near));
}

float normalizeDepth(float depth, float near, float far) {
    return (depth - near) / (far - near);
}

vec2 calcTAAVelocity(vec4 newPos, vec4 oldPos) {
	newPos /= newPos.w;
	oldPos /= oldPos.w;
	return newPos.xy - oldPos.xy;
}
