in vec3 v_viewNormal;
in vec2 v_uv;
in vec3 v_modelPosition;
in vec3 v_worldPosition;
in vec3 v_viewPosition;
#ifndef IS_FOR_ENV
  in vec4 v_currentFramePosition;
  in vec4 v_previousFramePosition;
  in vec4 v_directionalShadowCoord;
#endif

uniform sampler2D u_baseTexture;
uniform sampler2D u_normalTexture;
uniform sampler2D u_roughnessTexture;
uniform sampler2D u_aoTexture;
uniform vec3 u_color;

#if METALLIC == 1
  uniform sampler2D u_metallicTexture;
#endif

#ifdef IS_FOR_ENV
  uniform vec3 u_lightPosition;
  layout(location = 0) out vec4 outColor;
#else
  uniform sampler2D u_blueNoiseTexture;
  uniform vec2 u_blueNoiseSize;
  uniform vec2 u_blueNoiseOffset;

  layout(location = 0) out vec4 gAlbedoMetallic;
  layout(location = 1) out vec4 gNormalRoughShadowBloom;
  layout(location = 2) out vec4 gEmissiveAO;
  layout(location = 3) out vec2 gVelocity;
#endif


#include<common>
#include<colorSpace>
#ifndef IS_FOR_ENV
  #include<gbufferUtils>
  #include<getShadowMask>
#endif

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

float sdBox( in vec2 p, in vec2 b ) {
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

#ifdef IS_FOR_ENV
  vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
    return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
  }
#endif

void main() {
  #ifndef IS_FOR_ENV
    vec4 blueNoise = texture(u_blueNoiseTexture, (gl_FragCoord.xy + u_blueNoiseOffset) / u_blueNoiseSize);
  #endif

	float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;

  vec2 textureUvs = (v_uv - 0.5) * 1.0 + 0.5;
  float paint = 1.0 - step(0.0, sdBox(2.0 * (v_uv - 0.5), vec2(0.5)));

  vec3 albedo = (1.0 - 0.95 * paint) * SRGBToLinear(u_color * texture(u_baseTexture, textureUvs).rgb);
  float roughness = (1.0 - paint) * texture(u_roughnessTexture, textureUvs).r;
  float metalness = 0.0;

  float ao = texture(u_aoTexture, textureUvs).r;
  vec3 emissive = vec3(0.0);

	vec3 viewNormal = faceDirection * normalize(v_viewNormal);
	mat3 tbn = getTangentFrame(-v_viewPosition, viewNormal, textureUvs);
	vec3 normalTexture = texture(u_normalTexture, textureUvs).xyz * 2.0 - 1.0;
	normalTexture.xy *= 1.0;
	normalTexture = normalize(normalTexture);
	vec3 perturbedNormal = normalize(tbn * normalTexture);

	vec3 dxy = max(abs(dFdx(perturbedNormal)), abs(dFdy(perturbedNormal)));
  float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
  roughness += geometryRoughness;
  roughness = max( roughness, MIN_ROUGHNESS );
  roughness = min( roughness, 1.0 );
  float alpha = roughness * roughness;

  #ifdef IS_FOR_ENV
    vec3 N = inverseTransformDirection(perturbedNormal.xyz, viewMatrix); // normal in world space
    vec3 V = normalize(cameraPosition - v_worldPosition); // view direction
    vec3 L = u_lightPosition - v_worldPosition; // light direction
    float lightDistance = length(L);
    L /= lightDistance;
    vec3 H = normalize(V + L);
    vec3 reflection = normalize(reflect(-V, N));

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

	  float attenuation = 1.0 / (0.01 + 0.01 * lightDistance + 0.02 * lightDistance * lightDistance);
    vec3 radiance = vec3(1.0) * attenuation;

    vec3 kD = vec3(1.0) - F;
    kD *= 1.0 - metalness;

    vec3 color = 1.0 * (albedo * kD / 3.1415926 + specular) * radiance * NdL;

    outColor = vec4(min(vec3(10.0), color), 1.0);
  #else
    float shadow = getShadowMask(blueNoise);
    float bloomIntensity = 0.2;

    gAlbedoMetallic = vec4(albedo, metalness);
    gNormalRoughShadowBloom = vec4(perturbedNormal, packData(roughness, shadow, bloomIntensity));
    gEmissiveAO = vec4(emissive, ao);
    gVelocity = calcTAAVelocity(v_currentFramePosition, v_previousFramePosition);
  #endif
}
