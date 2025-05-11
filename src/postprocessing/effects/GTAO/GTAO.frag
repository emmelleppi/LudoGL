in vec2 v_uv;

uniform sampler2D u_normalTexture;
uniform sampler2D u_depthTexture;
uniform sampler2D u_inputTexture;
uniform vec2 u_resolution;
uniform vec4 u_projInfo;
uniform vec4 u_clipInfo;
uniform vec4 u_offsetParams;
uniform float u_colorBounceIntensity;

uniform vec2 u_blueNoiseSize;
uniform sampler2D u_blueNoiseTexture;
uniform vec2 u_blueNoiseOffset;

out vec4 fragColor;

#include<common>
#include<gbufferUtils>

float roundFloat( float value ) {
    return value < 0.5 ? floor( value ) : ceil( value );
}

vec2 roundVec2( vec2 vector ) {
    vector.x = roundFloat( vector.x );
    vector.y = roundFloat( vector.y );
    return vector;
}

float calculateFalloff( float squaredDistance ) {
    return 2.0 * clamp(
        ( squaredDistance - FALLOFF_START2 ) / ( FALLOFF_END2 - FALLOFF_START2 ),
        0.0,
        1.0
    );
}

vec4 getViewPosition( vec2 screenUV ) {
    float nearPlane = u_clipInfo.x;
    float farPlane = u_clipInfo.y;

    vec2 normalizedCoord = screenUV / u_resolution;
    float linearDepth = linearizeDepth(texture(u_depthTexture, normalizedCoord).r, nearPlane, farPlane);
    linearDepth = linearDepth == 0.0 ? farPlane : linearDepth;
    float normalizedDepth = normalizeDepth(linearDepth, nearPlane, farPlane);

    vec4 viewPos = vec4( 0.0 );
    viewPos.w = normalizedDepth;
    viewPos.z = linearDepth;
    viewPos.xy = ( screenUV * u_projInfo.xy + u_projInfo.zw ) * viewPos.z;

    return viewPos;
}

void main() {
    float sceneDepth = linearizeDepth(texture(u_depthTexture, v_uv).r, u_clipInfo.x, u_clipInfo.y);

    // if it's the background
    if (sceneDepth == 0.0) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    vec2 screenPosition = gl_FragCoord.xy;
    vec4 blueNoise = texture(u_blueNoiseTexture, (screenPosition + u_blueNoiseOffset) / u_blueNoiseSize);

    vec3 viewNormal = texture(u_normalTexture, v_uv).xyz;
    viewNormal.z = -viewNormal.z;
    vec3 viewPosition = getViewPosition(screenPosition).xyz;
    vec3 viewDirection = normalize(-viewPosition);

    vec3 samplePosition;
    vec3 rayDirection, worldSpaceVector;

    vec2 sampleOffset;
    vec2 horizonAngles = vec2(-1.0, -1.0);

    // scale the search radius by the depth and camera FOV
    float searchRadius = max(float(NUM_STEPS), (RADIUS * u_clipInfo.z) / viewPosition.z);
    float rayStepSize = searchRadius / float(NUM_STEPS);

    float rotationJitter = PI * blueNoise.r;
    float radiusJitter = PI * blueNoise.g;
    float jitteredOffset = blueNoise.b * rayStepSize;

    float currentStepSize = 1.0 + jitteredOffset + 0.25 * rayStepSize * u_offsetParams.y;
    float squaredDistance, inverseDistance, distanceFalloff, cosineHorizon;

    float azimuthAngle = 0.0;
    float ambientOcclusion = 0.0;

    #if ENABLE_COLOR_BOUNCE
        vec3 bounceColor = vec3(0.0);
    #endif

    #pragma unroll_loop_start
    for (int directionIndex = 0; directionIndex < NUM_DIRECTIONS; directionIndex++) {

        azimuthAngle = float(directionIndex) * (PI / float(NUM_DIRECTIONS)) + u_offsetParams.x * PI;
        azimuthAngle += rotationJitter;

        currentStepSize = 1.0 + 0.25 * rayStepSize * u_offsetParams.y;
        currentStepSize += radiusJitter;

        rayDirection = vec3(cos(azimuthAngle), sin(azimuthAngle), 0.0);
        horizonAngles = vec2(-1.0);

        // calculate horizon angles
        for (int stepIndex = 0; stepIndex < NUM_STEPS; ++stepIndex) {
            sampleOffset = roundVec2(rayDirection.xy * currentStepSize);

            // First horizon angle
            samplePosition = getViewPosition(screenPosition + sampleOffset).xyz;
            worldSpaceVector = samplePosition - viewPosition;

            squaredDistance = dot(worldSpaceVector, worldSpaceVector);
            inverseDistance = inversesqrt(squaredDistance);
            cosineHorizon = inverseDistance * dot(worldSpaceVector, viewDirection);
            distanceFalloff = calculateFalloff(squaredDistance);

            horizonAngles.x = max(horizonAngles.x, cosineHorizon - distanceFalloff);

            #if ENABLE_COLOR_BOUNCE
                vec3 pointColor, pointDirection;
                float attenuationFactor;
                pointColor = texture(u_inputTexture, (screenPosition + sampleOffset) / u_resolution).rgb;
                pointDirection = normalize(worldSpaceVector);
                attenuationFactor = clamp(length(worldSpaceVector) / float(RADIUS), 0.0, 1.0);
                bounceColor += pointColor * clamp(dot(pointDirection, viewNormal), 0.0, 1.0) * pow((1.0 - attenuationFactor), 2.0);
            #endif

            // Second horizon angle
            samplePosition = getViewPosition(screenPosition - sampleOffset).xyz;
            worldSpaceVector = samplePosition - viewPosition;

            squaredDistance = dot(worldSpaceVector, worldSpaceVector);
            inverseDistance = inversesqrt(squaredDistance);
            cosineHorizon = inverseDistance * dot(worldSpaceVector, viewDirection);
            distanceFalloff = calculateFalloff(squaredDistance);

            horizonAngles.y = max(horizonAngles.y, cosineHorizon - distanceFalloff);

            // increment step
            currentStepSize += rayStepSize;

            #if ENABLE_COLOR_BOUNCE
                pointColor = texture(u_inputTexture, (screenPosition - sampleOffset) / u_resolution).rgb;
                pointDirection = normalize(worldSpaceVector);
                attenuationFactor = clamp(length(worldSpaceVector) / float(RADIUS), 0.0, 1.0);
                bounceColor += pointColor * clamp(dot(pointDirection, viewNormal), 0.0, 1.0) * pow((1.0 - attenuationFactor), 2.0);
            #endif
        }

        horizonAngles = acos(horizonAngles);

        // calculate gamma angle
        vec3 perpVector = normalize(cross(rayDirection, viewDirection));
        vec3 tangentVector = cross(viewDirection, perpVector);
        vec3 projectedNormal = viewNormal - perpVector * dot(viewNormal, perpVector);

        float normalLength = length(projectedNormal);
        float inverseNormalLength = 1.0 / (normalLength + 1e-6);
        float cosineXi = dot(projectedNormal, tangentVector) * inverseNormalLength;
        float gammaAngle = acos(cosineXi) - HALF_PI;
        float cosineGamma = dot(projectedNormal, viewDirection) * inverseNormalLength;
        float doubleGammaSine = -2.0 * cosineXi;

        // clamp to normal hemisphere
        horizonAngles.x = gammaAngle + max(-horizonAngles.x - gammaAngle, -HALF_PI);
        horizonAngles.y = gammaAngle + min(horizonAngles.y - gammaAngle, HALF_PI);

        // Riemann integral is additive
        ambientOcclusion += normalLength * 0.25 * (
            (horizonAngles.x * doubleGammaSine + cosineGamma - cos(2.0 * horizonAngles.x - gammaAngle)) +
            (horizonAngles.y * doubleGammaSine + cosineGamma - cos(2.0 * horizonAngles.y - gammaAngle)));
    }
    #pragma unroll_loop_end

    // PDF = 1 / pi and must normalize with pi because of Lambert
    ambientOcclusion = ambientOcclusion / float(NUM_DIRECTIONS);

    #if ENABLE_COLOR_BOUNCE
        bounceColor /= float(NUM_STEPS * NUM_DIRECTIONS) * 2.0 / u_colorBounceIntensity;
        fragColor = vec4(ambientOcclusion, bounceColor);
    #else
        fragColor = vec4(ambientOcclusion, 0.0, 0.0, 0.0);
    #endif
}
