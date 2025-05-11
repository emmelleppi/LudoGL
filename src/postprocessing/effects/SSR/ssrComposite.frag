uniform sampler2D u_ssrTexture;
uniform sampler2D u_inputTexture;
uniform sampler2D u_normalRoughShadowBloom;

uniform float u_strength;
uniform float u_reflectionSpecularFalloffExponent;
uniform float u_roughnessCutoff;

in vec2 v_uv;
out vec4 fragColor;

#include<gbufferUtils>

void main()
{
    vec4 SSR = texture(u_ssrTexture, v_uv);
    vec4 color = texture(u_inputTexture, v_uv);
    vec4 normalRoughShadowBloom = texture(u_normalRoughShadowBloom, v_uv);
    float materialRoughness = 0.0;
    float shadow = 0.0;
    float bloom = 0.0;
    unpackData(normalRoughShadowBloom.a, materialRoughness, shadow, bloom);

    if (materialRoughness > u_roughnessCutoff) {
        fragColor = color;
        return;
    }

    vec3 reflectionMultiplier = clamp(pow(vec3(1.0 - materialRoughness) * u_strength, vec3(u_reflectionSpecularFalloffExponent)), 0.0, 1.0);
    vec3 colorMultiplier = 1.0 - reflectionMultiplier;
    vec3 finalColor = (color.rgb * colorMultiplier) + (SSR.rgb * reflectionMultiplier);
    // finalColor = (color.rgb) + (SSR.rgb );

    fragColor = vec4(finalColor, color.a);
}
