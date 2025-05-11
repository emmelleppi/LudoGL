uniform samplerCube u_texture;
in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec4 color = textureLod(u_texture, normalize(vec3(1.5 * (v_uv.x - 0.5), 1.5 * (v_uv.y - 0.5), 0.5)), 0.0);
    fragColor = color;
}
