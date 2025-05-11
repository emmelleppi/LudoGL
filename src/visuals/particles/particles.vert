in vec3 position;
in vec3 normal;
in vec2 a_simUv;

uniform sampler2D u_currPositionLifeTexture;
uniform vec2 u_simTextureSize;
uniform float u_scale;

#ifdef IS_DEPTH
#else
  uniform mat4 u_shadowMatrix;
  uniform float u_shadowNormalBias;

  out vec3 v_viewNormal;
  out vec3 v_modelPosition;
  out vec3 v_worldPosition;
  out vec3 v_viewPosition;
  out vec4 v_currentFramePosition;
  out vec4 v_previousFramePosition;
  out float v_emissive;
  out float v_distFromNearestEmissive;
  out vec4 v_directionalShadowCoord;
#endif

float linearStep(float edge0, float edge1, float x) {
    return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
}

void main() {
    vec2 texelSize = vec2(1.0) / u_simTextureSize;
    int emissiveCount = 4;
    float emissive = 0.0;
    if (a_simUv.x < texelSize.x * float(emissiveCount) && a_simUv.y < texelSize.y) {
      emissive = 1.0;
    }

    vec4 positionLife = texture(u_currPositionLifeTexture, a_simUv);
    float life = positionLife.w;
    float scale = u_scale * linearStep(0.0, 0.25, life) * linearStep(1.0, 0.75, life);

    vec3 pos = position * scale * (emissive > 0.5 ? 1.5 : 1.0) + positionLife.xyz;

    #ifndef IS_DEPTH
      vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
      v_currentFramePosition = viewProjectionMatrix * worldPosition;

      vec4 prevWorldPosition = prevModelMatrix * vec4(pos, 1.0);
      v_previousFramePosition = prevViewProjectionMatrix * prevWorldPosition;

      gl_Position = viewProjectionMatrixJittered * modelMatrix * vec4(pos, 1.0);

      v_viewNormal = normalMatrix * normal;
      v_modelPosition = position;
      v_worldPosition = worldPosition.xyz;
      v_viewPosition = -(modelViewMatrix * vec4(pos, 1.0)).xyz;
      v_directionalShadowCoord = u_shadowMatrix * worldPosition + vec4(normalize(normalMatrix * normal) * u_shadowNormalBias, 0.0);

      v_distFromNearestEmissive = 1e-6;
      v_emissive = emissive;

      if (emissive < 0.5) {
        float dist = 1000000.0;
        for(int i = 0; i < emissiveCount; i++) {
            vec2 emissiveUv = vec2(texelSize.x * (float(i) + 0.5), texelSize.y * 0.5);
            vec4 emissivePos = texture(u_currPositionLifeTexture, emissiveUv);
            dist = min(dist, length(positionLife.xyz - emissivePos.xyz / (linearStep(0.0, 0.25, emissivePos.w) * linearStep(1.0, 0.75, emissivePos.w))));
        }

        v_distFromNearestEmissive = dist;
      }

    #else
      gl_Position = viewProjectionMatrix * modelMatrix * vec4(pos, 1.0);
    #endif
}
