uniform sampler2D u_depthTexture;
uniform vec2 u_fromTextureSize;
uniform vec2 u_toTextureSize;

out vec4 fragColor;

#include<rgbDepthPackage>

void main() {
  vec2 ratio = u_fromTextureSize / u_toTextureSize;
  ivec2 readCoord = ivec2(gl_FragCoord.xy) * 2;

  float depth1 = unpackRGBToDepth(texelFetch(u_depthTexture, readCoord, 0).rgb);
  float depth2 = unpackRGBToDepth(texelFetch(u_depthTexture, readCoord + ivec2(1,0), 0).rgb);
  float depth3 = unpackRGBToDepth(texelFetch(u_depthTexture, readCoord + ivec2(0,1), 0).rgb);
  float depth4 = unpackRGBToDepth(texelFetch(u_depthTexture, readCoord + ivec2(1,1), 0).rgb);

  float minDepth = min(depth1, min(depth2, min(depth3, depth4)));

  bool needExtraSampleX = ratio.x > 2.0;
  bool needExtraSampleY = ratio.y > 2.0;

  // if (needExtraSampleX) {
  //   float depthX1 = unpackRGBToDepth(texelFetch(u_depthTexture, readCoord + ivec2(2,0), 0).rgb);
  //   float depthX2 = unpackRGBToDepth(texelFetch(u_depthTexture, readCoord + ivec2(2,1), 0).rgb);
  //   minDepth = min(minDepth, min(depthX1, depthX2));
  // }

  // if (needExtraSampleY) {
  //   float depthY1 = unpackRGBToDepth(texelFetch(u_depthTexture, readCoord + ivec2(0,2), 0).rgb);
  //   float depthY2 = unpackRGBToDepth(texelFetch(u_depthTexture, readCoord + ivec2(1,2), 0).rgb);
  //   minDepth = min(minDepth, min(depthY1, depthY2));
  // }

  // if (needExtraSampleX && needExtraSampleY) {
  //   float depthXY = unpackRGBToDepth(texelFetch(u_depthTexture, readCoord + ivec2(2,2), 0).rgb);
  //   minDepth = min(minDepth, depthXY);
  // }

  fragColor = vec4(packDepthToRGB(minDepth), 1.0);
}
