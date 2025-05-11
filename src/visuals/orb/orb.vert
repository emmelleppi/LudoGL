in vec3 position;
in vec3 normal;
in vec2 uv;

out vec3 v_viewNormal;
out vec2 v_uv;
out vec3 v_modelPosition;
out vec3 v_worldPosition;
out vec3 v_viewPosition;
out vec4 v_currentFramePosition;
out vec4 v_previousFramePosition;

void main() {
    vec3 pos = position;

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    gl_Position = viewProjectionMatrix * worldPosition;

    v_viewNormal = normalMatrix * normal;
    v_uv = uv;
    v_modelPosition = position;
    v_worldPosition = worldPosition.xyz;
    v_viewPosition = -(modelViewMatrix * vec4(pos, 1.0)).xyz;
}
