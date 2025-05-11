uniform sampler2D u_inputTexture;
uniform sampler2D u_supportTexture;

uniform float u_radius;

in vec2 v_uv;
in vec2 v_uv0;
in vec2 v_uv1;
in vec2 v_uv2;
in vec2 v_uv3;
in vec2 v_uv4;
in vec2 v_uv5;
in vec2 v_uv6;
in vec2 v_uv7;

out vec4 fragColor;

void main() {

	vec4 c = vec4(0.0);

	c += texture(u_inputTexture, v_uv0) * 0.0625;
	c += texture(u_inputTexture, v_uv1) * 0.125;
	c += texture(u_inputTexture, v_uv2) * 0.0625;
	c += texture(u_inputTexture, v_uv3) * 0.125;
	c += texture(u_inputTexture, v_uv) * 0.25;
	c += texture(u_inputTexture, v_uv4) * 0.125;
	c += texture(u_inputTexture, v_uv5) * 0.0625;
	c += texture(u_inputTexture, v_uv6) * 0.125;
	c += texture(u_inputTexture, v_uv7) * 0.0625;

	vec4 baseColor = texture(u_supportTexture, v_uv);
	fragColor = mix(baseColor, c, u_radius);
}
