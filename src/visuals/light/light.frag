in vec3 v_viewNormal;
in vec2 v_uv;
in vec3 v_modelPosition;
in vec3 v_worldPosition;
in vec3 v_viewPosition;
in vec4 v_currentFramePosition;
in vec4 v_previousFramePosition;

uniform vec3 u_lightPosition;

layout(location = 0) out vec4 gAlbedoMetallic;
layout(location = 1) out vec4 gNormalRoughShadowBloom;
layout(location = 2) out vec4 gEmissiveAO;
layout(location = 3) out vec2 gVelocity;

#include<common>
#include<colorSpace>
#include<gbufferUtils>

void main() {
	float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;

  vec3 albedo = vec3(1.0);
  float roughness = 1.0;
  float metalness = 0.0;
  float ao = 1.0;
  vec3 emissive = vec3(1.0);
	vec3 viewNormal = faceDirection * normalize(v_viewNormal);
  float bloomIntensity = 1.0;
  float shadow = 1.0;

  gAlbedoMetallic = vec4(albedo, metalness);
	gNormalRoughShadowBloom = vec4(viewNormal, packData(roughness, shadow, bloomIntensity));
	gEmissiveAO = vec4(emissive, ao);
	gVelocity = calcTAAVelocity(v_currentFramePosition, v_previousFramePosition);
}
