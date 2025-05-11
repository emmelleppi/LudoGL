uniform sampler2D u_texture;
uniform vec2 u_delta;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec4 color = texture(u_texture, v_uv) * 0.1633;

    vec2 delta = u_delta;
    color += texture(u_texture, v_uv - delta) * 0.1531;
    color += texture(u_texture, v_uv + delta) * 0.1531;

    delta += u_delta;
    color += texture(u_texture, v_uv - delta) * 0.12245;
    color += texture(u_texture, v_uv + delta) * 0.12245;

    delta += u_delta;
    color += texture(u_texture, v_uv - delta) * 0.0918;
    color += texture(u_texture, v_uv + delta) * 0.0918;

    delta += u_delta;
    color += texture(u_texture, v_uv - delta) * 0.051;
    color += texture(u_texture, v_uv + delta) * 0.051;

    fragColor = color;
}