uniform sampler2D u_inputTexture;
uniform sampler2D u_gradientTexture;
uniform sampler2D u_normalRoughShadowBloom;
uniform sampler2D u_emissiveTexture;
uniform float u_threshold;
uniform float u_smoothing;
uniform float u_aspectRatio;
uniform float u_halo;
uniform float u_haloRadius;
uniform float u_haloThickness;
uniform float u_haloThreshold;
uniform float u_ghostThreshold;
uniform float u_ghostSpacing;
uniform int u_ghostCount;

in vec2 v_uv;

layout(location = 0) out vec4 fragColor;

#include<gbufferUtils>

float luminance(const in vec3 color) {
	return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 applyThreshold(in vec3 _rgb, in float _threshold) {
	return max(_rgb - vec3(_threshold), vec3(0.0));
}

float windowCubic(float _x, float _center, float _radius) {
  _x = min(abs(_x - _center) / _radius, 1.0);
  return 1.0 - _x * _x * (3.0 - 2.0 * _x);
}

void main() {
  vec2 invUv = vec2(1.0) - v_uv; // flip the texture coordinates
	vec2 aspectRatio = vec2(u_aspectRatio, 1.0);

	float roughness = 0.0;
  float shadow = 0.0;
  float bloomIntensity = 0.0;
  unpackData(texture(u_normalRoughShadowBloom, v_uv).a, roughness, shadow, bloomIntensity);

  vec3 emissive = texture(u_emissiveTexture, v_uv).rgb;

	vec4 texel = texture(u_inputTexture, v_uv);
	float luma = bloomIntensity * luminance(texel.rgb + emissive);
	luma = smoothstep(u_threshold, u_threshold + u_smoothing, luma) * luma;

  // halo
  vec2 haloVec = vec2(0.5) - invUv;
  // haloVec.x /= u_aspectRatio;
  haloVec = normalize(haloVec);
  // haloVec.x *= u_aspectRatio;
  vec2 wuv = (invUv - vec2(0.5, 0.0)) / aspectRatio + vec2(0.5, 0.0);
  float d = distance(wuv, vec2(0.5));
  float haloWeight = windowCubic(d, u_haloRadius, u_haloThickness); // cubic window function
  haloVec *= u_haloRadius;
  vec3 halo = haloWeight * applyThreshold(
    texture(u_inputTexture, invUv + haloVec).rgb + texture(u_emissiveTexture, invUv + haloVec).rgb,
    u_haloThreshold
  );

  // ghost
  vec3 ghost = vec3(0.0);
  vec2 ghostVec = (vec2(0.5) - invUv) * u_ghostSpacing;

  for (int i = 0; i < u_ghostCount; ++i) {
    vec2 suv = fract(invUv + ghostVec * vec2(i));
    vec3 s = texture(u_inputTexture, suv).rgb + texture(u_emissiveTexture, suv).rgb;
    s = applyThreshold(s, u_ghostThreshold);
    float d = distance(suv, vec2(0.5));
    float weight = 1.0 - smoothstep(0.0, 0.75, d); // reduce contributions from samples at the screen edge
    ghost += s * weight;
  }

  // gradient
  const vec2 center = vec2(0.5);
  vec2 gradientUV = vec2(
      distance(v_uv, center) * 12.0,
      0.0
  );

  vec2 centerVec = v_uv - vec2(0.5);
	float radial = acos(centerVec.x / length(centerVec));
  vec3 gradient = 0.25 + 0.75 *texture(u_gradientTexture, vec2(0.75 *radial, 0.5)).rgb;

  fragColor.rgb = 0.15 * emissive + luma + gradient * u_halo * halo * ghost;
	fragColor.a = luma;
}
