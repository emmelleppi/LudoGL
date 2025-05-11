uniform sampler2D u_ssrTexture;
uniform sampler2D u_inputTexture;
uniform sampler2D u_depthReflectionMaskTexture;

uniform float u_strength;
uniform float u_reflectionSpecularFalloffExponent;
uniform float u_reflectivityThreshold;

in vec2 v_uv;
out vec4 fragColor;

void main()
{
    vec3 SSR = texture(u_ssrTexture, v_uv).rgb;
    vec4 color = texture(u_inputTexture, v_uv);
    float reflectionMask = texture( u_depthReflectionMaskTexture, v_uv ).a;

    if (reflectionMask <= u_reflectivityThreshold) {
        fragColor = color;
        return;
    }

    vec3 reflectionMultiplier = clamp(pow(vec3(reflectionMask) * u_strength, vec3(u_reflectionSpecularFalloffExponent)), 0.0, 1.0);
    vec3 colorMultiplier = 1.0 - reflectionMultiplier;
    vec3 finalColor = (color.rgb * colorMultiplier) + (SSR * reflectionMultiplier);
    fragColor = vec4(finalColor, color.a);
}
