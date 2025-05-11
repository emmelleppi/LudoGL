in vec3 v_viewNormal;
in vec2 v_uv;
in vec3 v_modelPosition;
in vec3 v_worldPosition;
in vec3 v_viewPosition;
in vec4 v_currentFramePosition;
in vec4 v_previousFramePosition;

uniform vec3 u_lightPosition;
uniform vec2 u_resolution;
uniform sampler2D u_sceneTexture;
uniform sampler2D u_depthTexture;
uniform samplerCube u_envMap;
uniform float u_near;
uniform float u_far;

layout(location = 0) out vec4 colorOutput;

#include<common>
#include<colorSpace>
#include<gbufferUtils>

vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}

void main() {
	float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
	vec2 uv = gl_FragCoord.xy / u_resolution;
  float depth = texture(u_depthTexture, uv).r;
  float viewZ = linearizeDepth(depth, u_near, u_far);

  if (viewZ < v_viewPosition.z) {
    discard;
  }

	vec3 viewNormal = faceDirection * normalize(v_viewNormal);
	vec3 N = inverseTransformDirection(viewNormal, viewMatrix); // normal in world space
  vec3 V = normalize(cameraPosition - v_worldPosition);
  vec3 R = reflect(-V, N);

  vec3 L = normalize(u_lightPosition - v_worldPosition);
  vec3 H = normalize(V + L);
  float NdL = max(0.0, dot(N, L));
  float NdH = max(0.0, dot(N, H));

  float roughness = 0.25;
  float alpha = roughness * roughness;
  float alphaSqr = alpha * alpha;
  float denom = NdH * NdH * (alphaSqr - 1.0) + 1.0;
  float D = alphaSqr / (3.14159 * denom * denom);

  float lightDistance = length(u_lightPosition - v_worldPosition);
  float attenuation = 1.0 / (1.0 + 0.1 * lightDistance + 0.01 * lightDistance * lightDistance);

  vec3 specular = vec3(1.0) * D * attenuation * NdL;
  specular = max(specular, 0.0);

  vec3 colorRefl = texture(u_envMap, R).rgb;

	float ior = 1.45; // Index of refraction for glass
	float cosi = clamp(dot(N, V), -1.0, 1.0);
  float etai = 1.0;
  float etat = ior;

  vec3 nrm = N;
  if (cosi > 0.0) {
    nrm = -N;
    float t=etai;
    etai=etat;
    etat=t;
  }
  float F0 = pow((etat-etai)/(etat+etai), 2.0);
  float fresnel = F0 + (1.0 - F0) * pow(1.0 - abs(cosi), 4.0);

	float refractionStrength = 0.25;
	vec3 viewDir = normalize(v_viewPosition);
	vec3 refractDir = refract(viewDir, viewNormal, 1.0/ior);
	vec2 refractionOffset = refractDir.xy * refractionStrength;
	vec2 refractionUV = uv + refractionOffset;
	refractionUV = clamp(refractionUV, 0.0, 1.0);
	vec3 sceneColor = texture(u_sceneTexture, refractionUV).rgb;

  colorOutput = vec4(0.05 + 0.1 * specular + 0.9 * mix(sceneColor, colorRefl, fresnel) + 0.25 * fresnel, 1.0);
}
