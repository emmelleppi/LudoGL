uniform sampler2D   u_velocityTexture;
uniform int         u_tileSize;               // dimensione tile

out vec4 fragColor;

vec2 vmax(vec2 a, vec2 b) {
  return (dot(a,a) > dot(b,b)) ? a : b;
}

void main() {
  ivec2 tileCoord = ivec2(gl_FragCoord.xy);
  ivec2 tileStart = tileCoord * u_tileSize;

  vec2 tileMaxVel = vec2(0.0);
  for (int y = 0; y < u_tileSize; ++y) {
    for (int x = 0; x < u_tileSize; ++x) {
      vec2 vel = texelFetch(u_velocityTexture, tileStart + ivec2(x,y), 0).xy;
      tileMaxVel = vmax(tileMaxVel, vel);
    }
  }

  fragColor = vec4(tileMaxVel, 0.0, 1.0);
}
