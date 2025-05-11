vec3 getViewPosition(vec2 uv, sampler2D depthTexture, float cameraNear, float cameraFar, mat4 invProjectionMatrix) {
    vec2 normalizedScreenPos = uv * 2.0 - vec2(1, 1);
    vec4 depthSample = texture(depthTexture, uv);
    float pixelDepth = -(unpackRGBToDepth(depthSample.rgb) * (cameraFar - cameraNear) + cameraNear);

    vec4 viewPos = invProjectionMatrix * vec4(normalizedScreenPos, -1, 1);
    vec3 initialRay = viewPos.xyz / viewPos.w;
    initialRay /= initialRay.z;
    return pixelDepth * initialRay;
}

vec2 calcVelocityFromDepths(vec2 uv, sampler2D currentDepthTexture, sampler2D prevDepthTexture, float cameraNear, float cameraFar, mat4 invProjectionMatrix, mat4 prevInvProjectionMatrix) {
    vec3 currentViewPos = getViewPosition(uv, currentDepthTexture, cameraNear, cameraFar, invProjectionMatrix);
    vec3 prevViewPos = getViewPosition(uv, prevDepthTexture, cameraNear, cameraFar, prevInvProjectionMatrix);

    vec4 currentClipPos = vec4(currentViewPos, 1.0);
    vec4 prevClipPos = vec4(prevViewPos, 1.0);
    currentClipPos /= currentClipPos.w;
    prevClipPos /= prevClipPos.w;

    return currentClipPos.xy - prevClipPos.xy;
}
