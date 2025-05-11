in vec3 position;
in vec3 normal;
in vec2 uv;

#ifndef IS_DEPTH
    out vec3 v_viewNormal;
    out vec2 v_uv;
    out vec3 v_modelPosition;
    out vec3 v_worldPosition;
    out vec3 v_viewPosition;
    out vec4 v_currentFramePosition;
    out vec4 v_previousFramePosition;
    out vec4 v_directionalShadowCoord;

    uniform mat4 u_shadowMatrix;
    uniform float u_shadowNormalBias;
#endif

void main() {
    vec3 pos = position;


    #ifndef IS_DEPTH
        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        v_currentFramePosition = viewProjectionMatrix * worldPosition;

        vec4 prevWorldPosition = prevModelMatrix * vec4(pos, 1.0);
        v_previousFramePosition = prevViewProjectionMatrix * prevWorldPosition;

        gl_Position = viewProjectionMatrixJittered * modelMatrix * vec4(pos, 1.0);

        v_viewNormal = normalMatrix * normal;
        v_uv = uv;
        v_modelPosition = position;
        v_worldPosition = worldPosition.xyz;
        v_viewPosition = -(modelViewMatrix * vec4(pos, 1.0)).xyz;

        v_directionalShadowCoord = u_shadowMatrix * worldPosition + vec4(normalize(normalMatrix * normal) * u_shadowNormalBias, 0.0);
    #else
          gl_Position = viewProjectionMatrix * modelMatrix * vec4(pos, 1.0);
    #endif
}
