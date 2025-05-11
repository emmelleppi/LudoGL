in vec3 v_viewNormal;
in vec2 v_uv;
in vec3 v_modelPosition;
in vec3 v_worldPosition;
in vec3 v_viewPosition;
in vec4 v_currentFramePosition;
in vec4 v_previousFramePosition;
in vec4 v_directionalShadowCoord;

uniform sampler2D u_baseTexture;
uniform sampler2D u_normalTexture;
uniform sampler2D u_metalRoughnessTexture;
uniform sampler2D u_aoTexture;
uniform sampler2D u_emissiveTexture;

uniform sampler2D u_blueNoiseTexture;
uniform vec2 u_blueNoiseSize;
uniform vec2 u_blueNoiseOffset;

layout(location = 0) out vec4 gAlbedoMetallic;
layout(location = 1) out vec4 gNormalRoughShadowBloom;
layout(location = 2) out vec4 gEmissiveAO;
layout(location = 3) out vec2 gVelocity;

#include<common>
#include<colorSpace>
#include<gbufferUtils>
#include<getShadowMask>

mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
	vec3 q0 = dFdx( eye_pos.xyz );
	vec3 q1 = dFdy( eye_pos.xyz );
	vec2 st0 = dFdx( uv.st );
	vec2 st1 = dFdy( uv.st );

	vec3 N = surf_norm; // normalized

	vec3 q1perp = cross( q1, N );
	vec3 q0perp = cross( N, q0 );

	vec3 T = q1perp * st0.x + q0perp * st1.x;
	vec3 B = q1perp * st0.y + q0perp * st1.y;

	float det = max( dot( T, T ), dot( B, B ) );
	float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );

	return mat3( T * scale, B * scale, N );
}

void main() {
	vec4 blueNoise = texture(u_blueNoiseTexture, (gl_FragCoord.xy + u_blueNoiseOffset) / u_blueNoiseSize);
	float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;

  vec3 albedo = SRGBToLinear(texture(u_baseTexture, v_uv).rgb);
  vec2 metalRoughness = texture(u_metalRoughnessTexture, v_uv).gb;
	float roughness = metalRoughness.x;
  float metalness = metalRoughness.y;
  float ao = texture(u_aoTexture, v_uv).r;
  vec3 emissive = SRGBToLinear(texture(u_emissiveTexture, v_uv).rgb);

	vec3 viewNormal = faceDirection * normalize(v_viewNormal);
	mat3 tbn = getTangentFrame(-v_viewPosition, viewNormal, v_uv);
	vec3 normalTexture = texture(u_normalTexture, v_uv).xyz * 2.0 - 1.0;
	normalTexture.xy *= 1.0;
	normalTexture = normalize(normalTexture);
	vec3 perturbedNormal = normalize(tbn * normalTexture);

	// vec3 dxy = max(abs(dFdx(perturbedNormal)), abs(dFdy(perturbedNormal)));
  // float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
  // roughness += geometryRoughness;
  roughness = max( roughness, MIN_ROUGHNESS );
  roughness = min( roughness, 1.0 );

	float shadow = getShadowMask(blueNoise);
  float bloomIntensity = 1.0;

  gAlbedoMetallic = vec4(albedo, metalness);
	gNormalRoughShadowBloom = vec4(perturbedNormal, packData(roughness, shadow, bloomIntensity));
	gEmissiveAO = vec4(emissive, ao);
	gVelocity = calcTAAVelocity(v_currentFramePosition, v_previousFramePosition);
}
