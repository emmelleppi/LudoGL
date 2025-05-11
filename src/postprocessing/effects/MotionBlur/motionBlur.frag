uniform sampler2D u_inputTexture;
uniform sampler2D u_velocityTexture;
uniform sampler2D u_neighborTexture;
uniform sampler2D u_depthTexture;

uniform float u_intensity;
uniform float u_velocityScale;
uniform float u_jitter;
uniform vec2 u_tiledTextureSize;
uniform float u_cameraFar;
uniform float u_cameraNear;
uniform float u_deltaTime;
uniform vec2 u_resolution;

uniform sampler2D u_blueNoiseTexture;
uniform vec2 u_blueNoiseOffset;
uniform vec2 u_blueNoiseSize;

in vec2 v_uv;
out vec4 outputColor;

#include<gbufferUtils>

float cone(float distance, float speed)
{
    return clamp(1.0 - distance / speed, 0.0, 1.0);
}

float cylinder(float distance, float speed)
{
    return 1.0 - smoothstep(0.95 * speed, 1.05 * speed, distance);
}

float softDepthCompare(float za, float zb)
{
    return clamp(1.0 - (za - zb) / min(za, zb), 0.0, 1.0);
}

vec2 getVelocity(vec2 uv) {
    vec2 velocity = texture(u_velocityTexture, uv).xy * u_velocityScale;
    vec2 motion = velocity * (0.01 / u_deltaTime);
    motion *= u_resolution * 0.5;
    motion /= max(vec2(1.0), length(motion) / u_tiledTextureSize);
    return motion * 0.5;
}

vec2 getNeighborMax(vec2 uv) {
    vec2 neighborVelocity = texture(u_neighborTexture, uv).xy;
    vec2 motion = neighborVelocity * (0.01 / u_deltaTime);
    motion *= u_resolution * 0.5;
    motion /= max(vec2(1.0), length(motion) / u_tiledTextureSize);
    return motion * 0.5;
}

void main() {
  vec2 coord = gl_FragCoord.xy;
  // blue noise for jittering
  vec4 blueNoise = texture(u_blueNoiseTexture, (coord + u_blueNoiseOffset) / u_blueNoiseSize);

  // sample neighbor texture to get maximum velocity of neighbors
  vec2 neighborMax = getNeighborMax(v_uv);
  bool didMove = dot(neighborMax, neighborMax) > 0.5;

  vec4 inputColor = texture(u_inputTexture, v_uv);

  // early-out if there's no significant motion
  if (!didMove) {                                  // same threshold as example
    outputColor = inputColor;
    return;
  }

  int s = SAMPLES;
  float zX = linearizeDepth(texture(u_depthTexture, v_uv).r, u_cameraNear, u_cameraFar);

  // sample velocity (fine per-pixel direction)
  float jitter = u_jitter * 2.0 * (blueNoise.x - 0.5);  // use neighborMax
  vec2 velocity = getVelocity(v_uv);
  float vXLen = length(velocity) + 0.00000001;
  float weight = 1.0 / max(vXLen, 0.5);
  vec3 sum = inputColor.rgb * weight;

  float sFloat = float(s);

  for (int i = 0; i < s; i += 1) {
      float t = mix(-0.2, 0.2, (float(i) + jitter + 1.0)/(sFloat + 1.0));
      vec2 offset = neighborMax * t;
      offset = u_tiledTextureSize * vec2(offset.x, -offset.y);

      vec2 Y = (coord + offset) / u_resolution; // Round to nearest

      vec4 sampledY = texture(u_inputTexture, Y).rgba;
      float zY = linearizeDepth(texture(u_depthTexture, Y).r, u_cameraNear, u_cameraFar);
      vec2 vY = getVelocity(Y);

      vec3 cY = sampledY.rgb;
      float vYLen = length(vY);
      float dist = length(offset);

      // Fore- vs. background classification of Y relative to X
      float f = softDepthCompare(zX, zY);
      float b = softDepthCompare(zY, zX);

      // Case 1: Blurry Y in front of any X
      float aY = f * cone(dist, vYLen);

      // Case 2: Any Y behind blurry X; estimate background
      aY += b * cone(dist, vXLen);

      // Case 3: Simultaneously blurry X and Y
      aY += cylinder(dist, vYLen) * cylinder(dist, vXLen) * 2.0;

      aY *= u_intensity;

      // Accumulate
      weight += aY;
      sum += aY * cY.rgb;
  }

  outputColor = vec4(sum/weight, 1.0);
}
