uniform sampler2D u_inputTexture;

// (1 / 4) * 0.5 = 0.125
#define WEIGHT_INNER 0.125
// (1 / 9) * 0.5 = 0.0555555
#define WEIGHT_OUTER 0.0555555

in vec2 v_uv;
in vec2 v_uv00;
in vec2 v_uv01;
in vec2 v_uv02;
in vec2 v_uv03;
in vec2 v_uv04;
in vec2 v_uv05;
in vec2 v_uv06;
in vec2 v_uv07;
in vec2 v_uv08;
in vec2 v_uv09;
in vec2 v_uv10;
in vec2 v_uv11;

out vec4 fragColor;

float clampToBorder(const in vec2 uv) {
	return float(uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0);
}

void main() {

	vec4 c = vec4(0.0);

	vec4 w = WEIGHT_INNER * vec4(
		clampToBorder(v_uv00),
		clampToBorder(v_uv01),
		clampToBorder(v_uv02),
		clampToBorder(v_uv03)
	);

	c += w.x * texture(u_inputTexture, v_uv00);
	c += w.y * texture(u_inputTexture, v_uv01);
	c += w.z * texture(u_inputTexture, v_uv02);
	c += w.w * texture(u_inputTexture, v_uv03);

	w = WEIGHT_OUTER * vec4(
		clampToBorder(v_uv04),
		clampToBorder(v_uv05),
		clampToBorder(v_uv06),
		clampToBorder(v_uv07)
	);

	c += w.x * texture(u_inputTexture, v_uv04);
	c += w.y * texture(u_inputTexture, v_uv05);
	c += w.z * texture(u_inputTexture, v_uv06);
	c += w.w * texture(u_inputTexture, v_uv07);

	w = WEIGHT_OUTER * vec4(
		clampToBorder(v_uv08),
		clampToBorder(v_uv09),
		clampToBorder(v_uv10),
		clampToBorder(v_uv11)
	);

	c += w.x * texture(u_inputTexture, v_uv08);
	c += w.y * texture(u_inputTexture, v_uv09);
	c += w.z * texture(u_inputTexture, v_uv10);
	c += w.w * texture(u_inputTexture, v_uv11);

	c += WEIGHT_OUTER * texture(u_inputTexture, v_uv);
	fragColor = c;
}
