uniform sampler2D u_texture;
in vec2 v_uv;

out vec4 fragColor;

void main() {
    fragColor.rgb = texture(u_texture, v_uv).aaa;
    fragColor.a = 1.0;
}
