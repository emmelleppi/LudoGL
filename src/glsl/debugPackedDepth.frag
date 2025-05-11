uniform sampler2D u_texture;

in vec2 v_uv;

out vec4 fragColor;

#include<rgbDepthPackage>

void main() {
    vec4 depth = texture(u_texture, v_uv);
    float normalizedDepth = unpackRGBToDepth(depth.rgb);
    fragColor = vec4(vec3(normalizedDepth), 1.0);
}
