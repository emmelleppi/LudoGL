uniform sampler2D u_inputTexture;
uniform vec2 u_resolution;
uniform vec2 u_blueNoiseSize;
uniform sampler2D u_blueNoiseTexture;
uniform vec2 u_blueNoiseOffset;

in vec2 v_uv;

out vec4 fragColor;

#include<colorSpace>
#include<acesToneMapping>

float blendScreen(float base, float blend) {
	return 1.0-((1.0-base)*(1.0-blend));
}

vec3 blendScreen(vec3 base, vec3 blend) {
	return vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));
}

vec3 blendScreen(vec3 base, vec3 blend, float opacity) {
	return (blendScreen(base, blend) * opacity + base * (1.0 - opacity));
}


void main() {
    vec4 blueNoise = texture(u_blueNoiseTexture, (gl_FragCoord.xy + u_blueNoiseOffset) / u_blueNoiseSize);
    vec2 aspect = vec2(1.0, u_resolution.x / u_resolution.y);
    vec2 texelSize = 1.0 / u_resolution;

    vec2 uv = (v_uv * 2.0 - 1.0);
    float r2 = dot(uv, uv);
    float distortion = 0.025;
    vec2 uvDistorted = uv * (0.95 + distortion * r2);
    vec2 tc = clamp((uvDistorted + 1.0) * 0.5, 0.0, 1.0);

    vec3 center = texture(u_inputTexture, tc).rgb;
    vec3 north = texture(u_inputTexture, tc + vec2(0.0, texelSize.y)).rgb;
    vec3 south = texture(u_inputTexture, tc + vec2(0.0, -texelSize.y)).rgb;
    vec3 east  = texture(u_inputTexture, tc + vec2(texelSize.x, 0.0)).rgb;
    vec3 west  = texture(u_inputTexture, tc + vec2(-texelSize.x, 0.0)).rgb;
    vec3 blur = (north + south + east + west + center) / 5.0;
    vec3 mask = center - blur;

    vec3 color = center + mask;

    float dist = length(uv);
    float vignetteRadius = 1.0;
    float vignetteSoftness = 0.5;
    float vignetteStrength = 0.5;
    vec3 vignetteColor = vec3(0.0);
    float vignette = smoothstep(vignetteRadius, vignetteRadius + vignetteSoftness, dist);
    vignette *= vignetteStrength;

    color = mix(color, vignetteColor, vignette);

    color = blendScreen(color, blueNoise.rgb, 0.015);
    color = ACESFilmicToneMapping(color);
    color = LinearToSRGB(color);

    fragColor = vec4(color, 1.0);
}
