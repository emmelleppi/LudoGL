// input texture containing tiled velocities
uniform sampler2D u_tiledVelocityTexture;
// size in texels of u_tiledVelocityTexture (e.g. W/k, H/k)
uniform ivec2 u_textureSize;

out vec4 fragColor;

// returns the vector with greater magnitude
vec2 vmax(vec2 a, vec2 b) {
    return (dot(a,a) > dot(b,b)) ? a : b;
}

void main() {
    ivec2 coord = ivec2(gl_FragCoord.xy) ;

    vec2 neighborMax = vec2(0.0);

    // loop over 9 neighbors with offsets -1, 0, +1
    for (int oy = -1; oy <= 1; ++oy) {
        for (int ox = -1; ox <= 1; ++ox) {
            ivec2 idx = coord + ivec2(ox, oy);
            // clamp to stay within texture bounds
            idx = clamp(idx, ivec2(0), u_textureSize - ivec2(1));
            vec2 velSample = texelFetch(u_tiledVelocityTexture, idx, 0).xy;
            neighborMax = vmax(neighborMax, velSample);
        }
    }

    fragColor = vec4(neighborMax, 0.0, 1.0);
}
