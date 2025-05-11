in vec3 v_worldDir;
out vec4 fragColor;

uniform samplerCube u_envMap;

const int SAMPLE_COUNT = 64;

vec3 getHemisphereSample(vec3 N, vec2 rand) {
    float phi = 2.0 * 3.1415926 * rand.x;
    float cosTheta = 1.0 - rand.y;
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);

    vec3 H = vec3(cos(phi) * sinTheta, sin(phi) * sinTheta, cosTheta);

    vec3 up = abs(N.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(up, N));
    vec3 bitangent = cross(N, tangent);

    return tangent * H.x + bitangent * H.y + N * H.z;
}

void main() {
    vec3 N = normalize(v_worldDir);
    vec3 irradiance = vec3(0.0);

    for (int i = 0; i < SAMPLE_COUNT; ++i) {
        vec2 rand = vec2(
            float(i) / float(SAMPLE_COUNT),
            fract(sin(float(i) * 12.9898) * 43758.5453)
        );
        vec3 sampleVec = getHemisphereSample(N, rand);
        float NdotL = max(dot(N, sampleVec), 0.0);
        irradiance += texture(u_envMap, sampleVec).rgb * NdotL;
    }

    irradiance = (irradiance / float(SAMPLE_COUNT)) * 3.1415926; // ∫ hemisphere cos(θ) dω = π

    fragColor = vec4(irradiance, 1.0);
}
