uniform sampler2D u_shadowMap;
uniform float u_shadowBias;
uniform float u_shadowNormalBias;
uniform vec2 u_shadowMapSize;

float texture2DCompare(sampler2D depths, vec2 uv, float compare) {
	float depth = texture(depths, uv).r;
    return step(compare, depth);
}

float getShadow(sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, vec4 shadowCoord) {
    float shadow = 1.0;

    shadowCoord.xyz /= shadowCoord.w;
    shadowCoord.z -= shadowBias;

    bvec4 inFrustumVec = bvec4(shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0);
    bool inFrustum = all(inFrustumVec);
    bvec2 frustumTestVec = bvec2(inFrustum, shadowCoord.z <= 1.0);
    bool frustumTest = all(frustumTestVec);

    if (frustumTest) {
        shadow = texture2DCompare(shadowMap, shadowCoord.xy, shadowCoord.z);
    }

    return shadow;
}

float getShadowMask(vec4 blueNoise) {
    float shadow = 1.0;
    shadow *= getShadow(u_shadowMap, u_shadowMapSize, u_shadowBias + blueNoise.z * 0.1, v_directionalShadowCoord + vec4((blueNoise.xy - 0.5) / u_shadowMapSize, 0.0, 0.0));
    return shadow;
}
