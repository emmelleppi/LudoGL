uniform vec3 u_cameraPosition;
uniform mat4 u_viewMatrix;
uniform mat4 u_inverseProjectionMatrix;
uniform mat4 u_inverseViewMatrix;
uniform float u_near;
uniform float u_far;
uniform vec3 u_lightPosition;

uniform sampler2D u_albedoMetallic;
uniform sampler2D u_normalRoughShadowBloom;
uniform sampler2D u_emissiveAO;
uniform sampler2D u_depth;

uniform samplerCube u_diffuseEnvMap;
uniform samplerCube u_specularEnvMap;
uniform sampler2D u_brdfLut;

in vec2 v_uv;

layout(location = 0) out vec4 gColor;

#include<common>
#include<colorSpace>
#include<gbufferUtils>

float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}

vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}

void main() {
  vec4 albedoMetallic = texture(u_albedoMetallic, v_uv);
  vec3 albedo = albedoMetallic.rgb;
  float metalness = albedoMetallic.a;

  vec4 normalRoughShadowBloom = texture(u_normalRoughShadowBloom, v_uv);
  vec3 normal = normalRoughShadowBloom.xyz;
	float roughness = 0.0;
  float shadow = 0.0;
  float bloomIntensity = 0.0;
  unpackData(normalRoughShadowBloom.a, roughness, shadow, bloomIntensity);

  float linearDepth = linearizeDepth(texture(u_depth, v_uv).r, u_near, u_far);
  vec3 worldPosition = worldPositionFromDepth(linearDepth, v_uv, u_inverseProjectionMatrix, u_inverseViewMatrix);

  vec4 emissiveAO = texture(u_emissiveAO, v_uv);
  vec3 emissive = emissiveAO.rgb;
  float ao = emissiveAO.a;

  float alpha = roughness * roughness;

	vec3 N = inverseTransformDirection(normal.xyz, u_viewMatrix); // normal in world space
	vec3 V = normalize(u_cameraPosition - worldPosition); // view direction
	vec3 L = u_lightPosition - worldPosition; // light direction
	float lightDistance = length(L);
	L /= lightDistance;
	vec3 H = normalize(V + L);
  vec3 R = normalize(reflect(-V, N));

	float NdL = max(0., dot(N, L));
	float LdH = max(0., dot(L, H));
	float NdH = max(0., dot(N, H));
	float NdV = max(0., dot(N, V));

  vec3 diffuseColor = (1.0 - metalness) * albedo;
  vec3 specularColor = mix( vec3( 0.04 ), albedo, metalness);

	float reflectance = 0.25;
  vec3 F0 = 0.16 * reflectance * reflectance * (1.0 - metalness) + albedo * metalness;
  vec3 F90 = vec3(clamp(dot(F0, vec3(50.0 * 0.33)), 0.04, 1.0));

	float alphaSqr = alpha * alpha;
	float denom = NdH * NdH *(alphaSqr-1.0) + 1.0;
	float D = alphaSqr/(PI * denom * denom);

	vec3 F = F0 + F90 * exp2((-5.55473 * LdH - 6.98316) * LdH);

	float k = alpha * .5;
	float k2 = k*k;
	float invK2 = 1.0-k2;
	float G = 1. / (LdH*LdH*invK2 + k2);

	vec3 specular = D * F * G * 5.0;
  specular = max(specular, 0.0);

	float attenuation = 1.0 / (0.0 + 0.01 * lightDistance + 0.025 * lightDistance * lightDistance);
	vec3 radiance = vec3(1.0) * attenuation;

	vec3 kD = vec3(1.0) - F;
	kD *= 1.0 - metalness;

	vec3 direct = (albedo * kD / 3.1415926 + specular) * radiance * NdL;
	vec3 color = max(direct, 0.0);
  color *= 0.1 + 0.9 * shadow;

  vec3 irradiance = texture(u_diffuseEnvMap, N).rgb;
  vec3 diffuseIBL = (1.0 - F0) * albedo * irradiance;

  float mipLevel = roughness * float(MAX_LOD);
  vec3 prefilteredColor = textureLod(u_specularEnvMap, R, mipLevel).rgb;

  vec2 brdf = texture(u_brdfLut, vec2(NdV, roughness)).rg;
	float reflectivity = pow((1.0 - roughness), 2.0) * 0.2;
  vec3 specularIBL = prefilteredColor * (F0 * brdf.x + brdf.y * reflectivity);

	diffuseIBL *= ao;
	specularIBL *= computeSpecularOcclusion(NdV, ao, roughness);
  vec3 indirect = diffuseIBL + 1.5 * specularIBL;

	color += indirect * (0.2 + 0.8 * shadow);
  color += emissive;

  gColor = vec4(color, 1.0);
}
