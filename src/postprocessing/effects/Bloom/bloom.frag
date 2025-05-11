uniform sampler2D u_inputTexture;
uniform vec2 u_textureSize;

uniform sampler2D u_bloomTexture;
uniform float u_bloomIntensity;

uniform sampler2D u_starburstTexture;
uniform float u_starburstOffset;
uniform sampler2D u_dirtMaskTexture;
uniform float u_dirtMaskAspectRatio;
uniform float u_aspectRatio;
in vec2 v_uv;

layout(location = 0) out vec4 fragColor;

void main() {
	vec2 aspectRatio = vec2(u_aspectRatio, 1.0);

  vec4 inputColor = texture(u_inputTexture, v_uv);
  vec4 bloom = texture(u_bloomTexture, v_uv);

	vec2 centerVec = v_uv - vec2(0.5);
	float d = length(centerVec);
	float radial = acos(centerVec.x / d);
  float mask =
		  texture(u_starburstTexture, vec2(radial + u_starburstOffset * 1.0, 0.0)).r
		* texture(u_starburstTexture, vec2(radial - u_starburstOffset * 0.5, 0.0)).r;
	mask = mix(mask, 1.0, smoothstep(0.5, 0.1, d));
	mask = mix(mask, 1.0, smoothstep(0.3, 0.6, d));
  mask *= 0.9;
  mask += u_bloomIntensity * bloom.a;

  vec2 dirtMaskAspectRatio = vec2(u_dirtMaskAspectRatio, 1.0);
  vec2 dirtMaskUv = (v_uv - 0.5) / dirtMaskAspectRatio * aspectRatio + 0.5;
  mask *= (0.2 + 0.8 * texture(u_dirtMaskTexture, dirtMaskUv).r);

  vec3 color = inputColor.rgb + mask * bloom.rgb * u_bloomIntensity;
	fragColor = vec4(color, 1.0);
}
