uniform sampler2D u_inputTexture;
uniform sampler2D u_historyTexture;
uniform highp sampler2D u_velocityTexture;
uniform vec2 u_resolution;
uniform float u_historyWeight;

in vec2 v_uv;
out vec4 fragColor;

vec4 AdjustHDRColor(vec3 color) {
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    float luminanceWeight = 1.0 / (1.0 + luminance);
    return vec4(color, 1.0) * luminanceWeight;
}

void main() {
    vec2 velocity = texture(u_velocityTexture, v_uv).xy;
    vec4 currentColor = AdjustHDRColor(texture(u_inputTexture, v_uv).rgb);
    vec4 historyColor;

    vec2 previousPixelPos = v_uv - velocity;
    if (any(lessThan(previousPixelPos, vec2(0.0))) || any(greaterThan(previousPixelPos, vec2(1.0)))) {
        historyColor = currentColor;
    } else {
        historyColor = texture(u_historyTexture, previousPixelPos);
    }

    vec3 nearColor0 = AdjustHDRColor(textureOffset(u_inputTexture, v_uv, ivec2(1, 0)).rgb).rgb;
    vec3 nearColor1 = AdjustHDRColor(textureOffset(u_inputTexture, v_uv, ivec2(0, 1)).rgb).rgb;
    vec3 nearColor2 = AdjustHDRColor(textureOffset(u_inputTexture, v_uv, ivec2(-1, 0)).rgb).rgb;
    vec3 nearColor3 = AdjustHDRColor(textureOffset(u_inputTexture, v_uv, ivec2(0, -1)).rgb).rgb;

    vec3 boxMin = min(currentColor.rgb, min(nearColor0, min(nearColor1, min(nearColor2, nearColor3))));
    vec3 boxMax = max(currentColor.rgb, max(nearColor0, max(nearColor1, max(nearColor2, nearColor3))));
    historyColor.rgb = clamp(historyColor.rgb, boxMin, boxMax);

    float currentWeight = (1.0 - u_historyWeight) * currentColor.a;
    float previousWeight = u_historyWeight * historyColor.a;

    vec3 color = (currentColor.rgb * currentWeight + historyColor.rgb * previousWeight);
    color /= (currentWeight + previousWeight);

    // vec3 blur =
    // (textureOffset(u_inputTexture, v_uv, ivec2( 1, 0)).rgb +
    //  textureOffset(u_inputTexture, v_uv, ivec2(-1, 0)).rgb +
    //  textureOffset(u_inputTexture, v_uv, ivec2( 0, 1)).rgb +
    //  textureOffset(u_inputTexture, v_uv, ivec2( 0,-1)).rgb) * 0.25;
    // color = color + clamp(color - blur, 0.0, 1.0) * 0.05;

    fragColor = vec4(color, 1.0);
}
