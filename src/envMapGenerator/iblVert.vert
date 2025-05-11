in vec3 position;
in vec3 normal;
in vec2 uv;

out vec3 v_worldDir;
out vec2 v_uv;
void main() {
    v_worldDir = position;
    v_uv = uv;
    gl_Position = viewProjectionMatrix * modelMatrix * vec4(position, 1.0);
}
