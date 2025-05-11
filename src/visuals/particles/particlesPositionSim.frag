uniform sampler2D u_defaultPositionLifeTexture;
uniform sampler2D u_defaultVelocityLifeTexture;
uniform sampler2D u_velocityLifeTexture;
uniform sampler2D u_positionLifeTexture;
uniform float u_time;
uniform float u_deltaTime;
uniform vec2 u_textureSize;

in vec2 v_uv;
out vec4 fragColor;

#define PI2 6.283185307179586

void main() {
    vec2 texelSize = vec2(1.0) / u_textureSize;
    vec4 posLife = texture(u_positionLifeTexture, v_uv);

    bool isEmissive = false;
    if (v_uv.x < texelSize.x * 4.0 && v_uv.y < texelSize.y) {
        isEmissive = true;
    }

    posLife.w -= (isEmissive ? 0.25 : 1.0 ) * u_deltaTime;

    if (posLife.w < 0.0) {
        vec3 defPosOrigin = texture(u_defaultPositionLifeTexture, v_uv).xyz;
        posLife.xyz = defPosOrigin;
        posLife.w += 1.;
        fragColor = posLife;
        return;
    }

    vec3 velocity = texture(u_velocityLifeTexture, v_uv).xyz;
    posLife.xyz += (isEmissive ? 0.5 : 1.0) * 0.0075 * velocity * u_deltaTime;

    fragColor = posLife;
}
