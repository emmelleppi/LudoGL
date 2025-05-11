in vec2 position;

uniform vec2 u_texelSize;

out vec2 v_uv;
out vec2 v_uv00;
out vec2 v_uv01;
out vec2 v_uv02;
out vec2 v_uv03;
out vec2 v_uv04;
out vec2 v_uv05;
out vec2 v_uv06;
out vec2 v_uv07;
out vec2 v_uv08;
out vec2 v_uv09;
out vec2 v_uv10;
out vec2 v_uv11;

void main() {

	v_uv = position.xy * 0.5 + 0.5;

	v_uv00 = v_uv + u_texelSize * vec2(-1.0, 1.0);
	v_uv01 = v_uv + u_texelSize * vec2(1.0, 1.0);
	v_uv02 = v_uv + u_texelSize * vec2(-1.0, -1.0);
	v_uv03 = v_uv + u_texelSize * vec2(1.0, -1.0);

	v_uv04 = v_uv + u_texelSize * vec2(-2.0, 2.0);
	v_uv05 = v_uv + u_texelSize * vec2(0.0, 2.0);
	v_uv06 = v_uv + u_texelSize * vec2(2.0, 2.0);
	v_uv07 = v_uv + u_texelSize * vec2(-2.0, 0.0);
	v_uv08 = v_uv + u_texelSize * vec2(2.0, 0.0);
	v_uv09 = v_uv + u_texelSize * vec2(-2.0, -2.0);
	v_uv10 = v_uv + u_texelSize * vec2(0.0, -2.0);
	v_uv11 = v_uv + u_texelSize * vec2(2.0, -2.0);

	gl_Position = vec4(position.xy, 1.0, 1.0);

}