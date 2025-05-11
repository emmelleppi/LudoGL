in vec2 position;

uniform vec2 u_texelSize;

out vec2 v_uv;
out vec2 v_uv0;
out vec2 v_uv1;
out vec2 v_uv2;
out vec2 v_uv3;
out vec2 v_uv4;
out vec2 v_uv5;
out vec2 v_uv6;
out vec2 v_uv7;

void main() {

	v_uv = position.xy * 0.5 + 0.5;

	v_uv0 = v_uv + u_texelSize * vec2(-1.0, 1.0);
	v_uv1 = v_uv + u_texelSize * vec2(0.0, 1.0);
	v_uv2 = v_uv + u_texelSize * vec2(1.0, 1.0);
	v_uv3 = v_uv + u_texelSize * vec2(-1.0, 0.0);

	v_uv4 = v_uv + u_texelSize * vec2(1.0, 0.0);
	v_uv5 = v_uv + u_texelSize * vec2(-1.0, -1.0);
	v_uv6 = v_uv + u_texelSize * vec2(0.0, -1.0);
	v_uv7 = v_uv + u_texelSize * vec2(1.0, -1.0);

	gl_Position = vec4(position.xy, 1.0, 1.0);

}