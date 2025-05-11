in vec2 v_uv;

uniform sampler2D u_inputTexture;
uniform sampler2D u_normalTexture;
uniform sampler2D u_depthReflectionMaskTexture;
uniform mat4 u_projectionMatrix;
uniform mat4 u_invProjectionMatrix;
uniform vec2 u_resolution;
uniform float u_stride;
uniform float u_thickness;
uniform float u_roughnessCutoff;
uniform float u_maxDistance;
uniform float u_roughnessFactor;
uniform float u_reflectivityThreshold;
uniform float u_cameraFar;
uniform float u_cameraNear;
uniform int u_hiZLevels;

uniform sampler2D u_blueNoiseTexture;
uniform vec2 u_blueNoiseOffset;
uniform vec2 u_blueNoiseSize;

out vec4 fragColor;

float computeAttenuationForIntersection(ivec2 hitPixel, vec2 hitUV, vec3 viewSpaceRayOrigin, vec3 viewSpaceHitPoint, vec3 reflectionVector, float maxRayDistance, float numIterations) {
    float totalAttenuation = 1.0;

    // Attenuation against the border of the screen
    vec2 screenEdgeDistance = smoothstep(0.2, 0.6, abs(vec2(0.5, 0.5) - hitUV.xy));
    float borderAttenuation = clamp(1.0 - (screenEdgeDistance.x + screenEdgeDistance.y), 0.0, 1.0);
    totalAttenuation *= borderAttenuation;

    // Attenuation based on the distance between the origin of the reflection ray and the intersection point
    float rayDistanceAttenuation = 1.0 - clamp(distance(viewSpaceRayOrigin, viewSpaceHitPoint) / maxRayDistance, 0.0, 1.0);
    totalAttenuation *= rayDistanceAttenuation;

    // Attenuation based on the number of iterations performed to find the intersection
    float stepAttenuation = 1.0 - (numIterations / float(MAX_STEPS));
    totalAttenuation *= stepAttenuation;

    // This will check the direction of the normal of the reflection sample with the
    // direction of the reflection vector, and if they are pointing in the same direction,
    // it will drown out those reflections since backward facing pixels are not available
    // for screen space reflection. Attenuate reflections for angles between 90 degrees
    // and 100 degrees, and drop all contribution beyond the (-100,100)  degree range
    vec3 intersectionNormal = texelFetch(u_normalTexture, hitPixel, 0).xyz;
    float normalAttenuation = smoothstep(-0.17, 0.0, dot(intersectionNormal, -reflectionVector));
    totalAttenuation *= normalAttenuation;

    return totalAttenuation;
}

vec3 fresnelSchlickGGX(float viewDotHalf, vec3 baseReflectivity, vec3 grazeReflectivity)
{
    return baseReflectivity + (grazeReflectivity - baseReflectivity) * pow(1.0 - viewDotHalf, 5.0);
}

bool doesIntersect(float rayMaxDepth, float rayMinDepth, vec2 sampleUV, int lod, float thickness) {
    vec3 packedDepth = textureLod(u_depthReflectionMaskTexture, sampleUV, float(lod)).rgb;
    float surfaceDepth = -(unpackRGBToDepth(packedDepth) * (u_cameraFar - u_cameraNear) + u_cameraNear);
    return surfaceDepth != 0.0 && rayMinDepth > surfaceDepth - thickness && rayMaxDepth < surfaceDepth;
}

vec3 Deproject(vec3 clipPos) {
    vec4 viewPos = u_invProjectionMatrix * vec4(clipPos, 1);
    return viewPos.xyz / viewPos.w;
}

vec3 Project(vec3 viewPos) {
    vec4 projectedPos = u_projectionMatrix * vec4(viewPos, 1);
    return projectedPos.xyz / projectedPos.w;
}

float distanceSquared(vec2 firstPoint, vec2 secondPoint) {
    vec2 displacement = firstPoint - secondPoint;
    return dot(displacement, displacement);
}

void swapIfBigger(inout float smaller, inout float bigger) {
    if (smaller > bigger) {
        float temp = smaller;
        smaller = bigger;
        bigger = temp;
    }
}

bool isOutsideUvBounds(float coord) {
    return coord < 0.0 || coord > 1.0;
}

bool isOutsideUvBounds(vec2 coords) {
    return isOutsideUvBounds(coords.x) || isOutsideUvBounds(coords.y);
}

void main() {
    // Screen position information
    vec2 normalizedScreenPos = v_uv * 2.0 - vec2(1, 1);
    float nearPlaneZ = Deproject(vec3(0, 0, -1)).z;

    // Sample scene data
    vec4 depthReflectionMask = texture(u_depthReflectionMaskTexture, v_uv);
    float pixelDepth = -(unpackRGBToDepth(depthReflectionMask.rgb) * (u_cameraFar - u_cameraNear) + u_cameraNear);
    float materialReflectivity = depthReflectionMask.a;

    if (materialReflectivity < u_reflectivityThreshold) {
        fragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }

    if (pixelDepth == 0.0) {
        fragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }

    // Sample and average normals from 3x3 neighborhood
    vec4 surfaceProperties = vec4(0.0);
    for(int i = -1; i <= 1; i++) {
        for(int j = -1; j <= 1; j++) {
            vec2 neighborOffset = vec2(float(i), float(j)) / u_resolution;
            surfaceProperties += texture(u_normalTexture, v_uv + neighborOffset);
        }
    }
    surfaceProperties /= 9.0;

    vec3 pixelNormal = normalize(surfaceProperties.xyz);
    float materialRoughness = surfaceProperties.a;

    if (materialRoughness >= u_roughnessCutoff) {
        fragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }

    vec3 initialRay = Deproject(vec3(normalizedScreenPos, -1));
    initialRay /= initialRay.z;
    vec3 pixelViewPos = pixelDepth * initialRay;
    vec3 viewDir = normalize(pixelViewPos);
    vec3 reflectDir = normalize(reflect(viewDir, pixelNormal));

    float reflectionStrength = 1.0 - smoothstep(0.25, 0.5, dot(-viewDir, reflectDir));
    vec2 hitUV = vec2(0.0);
    vec3 hitPos = vec3(0.0);
    bool foundIntersection = false;
    float stepCount = 0.0;

    // Define view space values
    float maxDistance = u_maxDistance;
    float traceDistance = (pixelViewPos.z + reflectDir.z * maxDistance) > nearPlaneZ ?
                         (nearPlaneZ - pixelViewPos.z) / reflectDir.z : maxDistance;
    vec3 traceStart = pixelViewPos;
    vec3 traceEnd = traceStart + reflectDir * traceDistance;

    // Project ray endpoints to clip space
    vec4 startClip = u_projectionMatrix * vec4(traceStart, 1.0);
    vec4 endClip = u_projectionMatrix * vec4(traceEnd, 1.0);

    // Calculate homogeneous divide factors
    float startInvW = 1.0 / startClip.w;
    float endInvW = 1.0 / endClip.w;

    // Calculate normalized device coordinates
    vec3 startNDC = traceStart.xyz * startInvW;
    vec3 endNDC = traceEnd.xyz * endInvW;

    // Convert to screen space coordinates
    vec2 startScreen = startClip.xy * startInvW;
    vec2 endScreen = endClip.xy * endInvW;
    startScreen = startScreen * 0.5 + vec2(0.5);
    endScreen = endScreen * 0.5 + vec2(0.5);
    startScreen *= u_resolution;
    endScreen *= u_resolution;

    // Ensure endpoints are distinct
    endScreen += vec2((distanceSquared(startScreen, endScreen) < 0.0001) ? 0.01 : 0.0);
    vec2 screenDelta = endScreen - startScreen;

    // Ensure X is the major axis
    bool swappedAxis = false;
    if (abs(screenDelta.x) < abs(screenDelta.y)) {
        swappedAxis = true;
        screenDelta = screenDelta.yx;
        startScreen = startScreen.yx;
        endScreen = endScreen.yx;
    }

    float stepDirection = sign(screenDelta.x);
    float invDeltaX = stepDirection / screenDelta.x;

    // Calculate per-step derivatives
    vec3 ndcIncrement = (endNDC - startNDC) * invDeltaX;
    float wIncrement = (endInvW - startInvW) * invDeltaX;
    vec2 screenIncrement = vec2(stepDirection, screenDelta.y * invDeltaX);

    // Initialize ray marching state
    vec4 marchingState = vec4(startScreen, startNDC.z, startInvW);
    vec4 marchingIncrement = vec4(screenIncrement, ndcIncrement.z, wIncrement);

    // Apply initial step
    marchingState += marchingIncrement;
    marchingIncrement *= u_stride;

    // Ray marching state
    float screenEndPos = endScreen.x * stepDirection;
    float lastZMax = marchingState.z / marchingState.w;
    float zMin = lastZMax;
    float zMax = lastZMax;
    float marchSteps = 0.0;
    vec2 currentScreenPos;

    float searchRadius = 0.0;
    vec3 finalColor = vec3( 0.0 );

    for (marchSteps = 1.0; marchSteps <= float(MAX_STEPS); marchSteps++) {
        marchingState += ( marchingIncrement / u_stride ) * ( max( searchRadius, u_stride ) );

        zMin = lastZMax;
        zMax = (marchingIncrement.z * 0.5 + marchingState.z) / (marchingIncrement.w * 0.5 + marchingState.w);
        lastZMax = zMax;
        swapIfBigger(zMax, zMin);

        currentScreenPos = swappedAxis ? marchingState.yx : marchingState.xy;
        hitUV = currentScreenPos / u_resolution;

        if (zMin > 0.0) break;
        if (isOutsideUvBounds(hitUV)) break;

        float rayDist = abs( ( ( zMax - lastZMax ) / ( marchingIncrement.z - lastZMax ) ) * traceDistance );
        searchRadius = rayDist * materialRoughness * 3.0;

        float radius = searchRadius * marchingState.w;
        float lod = radius * float(u_hiZLevels);

        foundIntersection = doesIntersect(zMax, zMin, hitUV, int(ceil(lod)), u_thickness + searchRadius);

        if (foundIntersection || (marchingState.x * stepDirection) > screenEndPos) break;
    }

    startNDC.xy += ndcIncrement.xy * marchSteps;
    startNDC.z = marchingState.z;
    hitPos = startNDC / marchingState.w;
    stepCount = marchSteps + 1.0;

    // Calculate Fresnel effect
    vec3 F0 = vec3(materialReflectivity);
    vec3 fresnelTerm = fresnelSchlickGGX(max(dot(pixelNormal, -viewDir), 0.0), F0, vec3(1.));

    // Calculate final SSR color
    vec3 reflectedColor = vec3(0.0);
    if (foundIntersection) {
        reflectedColor = texture(u_inputTexture, hitUV).rgb;
    }
    reflectedColor *= fresnelTerm;

    float blurAmount = 0.0;
    float adjustedRoughness = (1.0 - u_roughnessFactor) * materialRoughness + 0.005 / (1.0 * searchRadius * searchRadius + 1.0);

    if (adjustedRoughness > 0.001) {
        float coneAngle = min(adjustedRoughness, 0.999) * 3.14159265 * 0.5;
        float rayDistance = distance(currentScreenPos, hitUV);
        float coneWidth = 2.0 * tan(coneAngle) * rayDistance;

        float sideLength = coneWidth;
        float height = rayDistance;
        float squaredSide = sideLength * sideLength;
        float squaredHeight = 4.0 * height * height;

        blurAmount = (sideLength * (sqrt(squaredSide + squaredHeight) - sideLength)) / (4.0 * height);
    }
    fragColor = vec4(reflectedColor, blurAmount / 255.0);
}
