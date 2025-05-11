in vec3 v_viewNormal;
in vec3 v_modelPosition;
in vec3 v_worldPosition;
in vec3 v_viewPosition;
in vec4 v_currentFramePosition;
in vec4 v_previousFramePosition;
in vec4 v_directionalShadowCoord;
in float v_emissive;
in float v_distFromNearestEmissive;

uniform sampler2D u_baseTexture;
uniform sampler2D u_normalTexture;
uniform sampler2D u_metalRoughnessTexture;
uniform sampler2D u_aoTexture;
uniform sampler2D u_emissiveTexture;
uniform vec3 u_color;
uniform vec3 u_emissiveColor;

uniform float u_metalness;
uniform float u_roughness;

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

void main () {
  vec4 blueNoise = texture(u_blueNoiseTexture, (gl_FragCoord.xy + u_blueNoiseOffset) / u_blueNoiseSize);
	float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;

  float metalness = u_metalness;
	float roughness = u_roughness;
  float ao = 0.;

  float emissiveAttenuationSoft =  1.0 / (1.0 + 6.0 * v_distFromNearestEmissive);
  float emissiveAttenuationMid = 1.0 / (2.0 + 6.0 * v_distFromNearestEmissive * v_distFromNearestEmissive);
  float emissiveAttenuationHard = 1.0 / (0. + 200.0 * v_distFromNearestEmissive * v_distFromNearestEmissive);

  vec3 albedo = SRGBToLinear(u_color);
  vec3 emissive = SRGBToLinear(u_emissiveColor * (emissiveAttenuationSoft + emissiveAttenuationMid) + (0.5 + 0.5 * u_color) * emissiveAttenuationHard);
  emissive *= emissive;

	vec3 viewNormal = faceDirection * normalize(v_viewNormal);

	vec3 dxy = max(abs(dFdx(viewNormal)), abs(dFdy(viewNormal)));
  float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
  roughness += geometryRoughness;
  roughness = max( roughness, MIN_ROUGHNESS );

	float shadow = getShadowMask(blueNoise);
  float bloomIntensity = 0.5 + 0.5 * saturate(emissiveAttenuationHard);

  gAlbedoMetallic = vec4(albedo, metalness);
	gNormalRoughShadowBloom = vec4(viewNormal, packData(roughness, shadow, bloomIntensity));
	gEmissiveAO = vec4(emissive, ao);
	gVelocity = calcTAAVelocity(v_currentFramePosition, v_previousFramePosition);
}
