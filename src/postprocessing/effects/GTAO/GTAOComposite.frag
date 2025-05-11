in vec2 v_uv;

uniform sampler2D u_inputTexture;
uniform sampler2D u_depthTexture;
uniform sampler2D u_normalTexture;
uniform sampler2D u_gtaoTexture;
uniform sampler2D u_emissiveTexture;
uniform vec2 u_aoSize;
uniform vec2 u_fullSize;
uniform float u_intensity;
uniform int u_blurStride;
uniform vec4 u_clipInfo;

out vec4 fragColor;

#include<gbufferUtils>

vec3 MultiBounce(float ao, vec3 albedo) {
    vec3 aoVec = vec3(ao);
    vec3 a = 2.0404 * albedo - 0.3324;
    vec3 b = -4.7951 * albedo + 0.6417;
    vec3 c = 2.7552 * albedo + 0.6903;
    return max(aoVec, ((aoVec * a + b) * aoVec + c) * aoVec);
}

vec4 sampleAOTexture(vec2 uv) {
    #if ENABLE_COLOR_BOUNCE == 0
        return vec4(texture(u_gtaoTexture, uv).r, 0.0, 0.0, 0.0);
    #else
        return texture(u_gtaoTexture, uv);
    #endif
}

void main() {
    vec4 originalColor = texture(u_inputTexture, v_uv);
    vec3 emissiveColor = texture(u_emissiveTexture, v_uv).rgb;
    float emissiveLuma = dot(emissiveColor, vec3(0.299, 0.587, 0.114));
    vec4 gtaoSample;

    #if USE_BLUR == 0
        gtaoSample = sampleAOTexture(v_uv);
    #else
        vec2 pixelSizeRatio = u_aoSize / u_fullSize;
        vec2 currentPixelPos = v_uv * u_fullSize;
        vec2 currentAoPixelPos = v_uv * u_aoSize;

        vec3 currentNormal = texture(u_normalTexture, v_uv).rgb;
        float currentPixelDepth = linearizeDepth(texture(u_depthTexture, v_uv).r, u_clipInfo.x, u_clipInfo.y);

        float blurStartOffset = (-float(BLUR_ITERATIONS) * 0.5 +
            (mod(float(BLUR_ITERATIONS), 2.0) == 0.0 ? 0.0 : 0.5)) * float(u_blurStride);

        gtaoSample = vec4(0.0);

        float weightSum = 1e-10;
        float stride = float(u_blurStride);

        for (int i = 0; i < BLUR_ITERATIONS * BLUR_ITERATIONS; i++) {
            int blurX = i / BLUR_ITERATIONS;
            int blurY = i % BLUR_ITERATIONS;
            vec2 blurStep = vec2(float(blurX), float(blurY)) * stride;

            vec2 sampleUV = (currentPixelPos + (blurStartOffset + blurStep) / pixelSizeRatio) / u_fullSize;
            vec2 aoSampleUV = (currentAoPixelPos + blurStartOffset + blurStep) / u_aoSize;

            float sampleDepth = linearizeDepth(texture(u_depthTexture, sampleUV).r, u_clipInfo.x, u_clipInfo.y);

            if (abs(sampleDepth - currentPixelDepth) <= DEPTH_THRESHOLD) {
                vec3 sampleNormal = texture(u_normalTexture, sampleUV).rgb;
                float weight = max(0.0, dot(sampleNormal, currentNormal));
                weight *= weight;

                gtaoSample += sampleAOTexture(aoSampleUV) * weight;
                weightSum += weight;
            }
        }
        gtaoSample /= weightSum;
    #endif

    gtaoSample.r = mix(gtaoSample.r, 1.0, emissiveLuma);
    gtaoSample.gba = gtaoSample.gba + emissiveColor;
    float occlusionFactor = gtaoSample.r;

    #if COLOR_ONLY
        fragColor = vec4(gtaoSample.gba, 1.0);
    #elif AO_ONLY
        fragColor = vec4(mix(vec3(1.0), vec3(occlusionFactor), u_intensity), 1.0);
    #else
        vec3 occludedColor = mix(originalColor.rgb, originalColor.rgb * MultiBounce(occlusionFactor, originalColor.rgb), u_intensity);
        float bounceIntensity = 1.0 - pow(1.0 - occlusionFactor, 2.0);
        fragColor = vec4(occludedColor + gtaoSample.gba * (0.75 + bounceIntensity * 0.25), originalColor.a);
    #endif
}
