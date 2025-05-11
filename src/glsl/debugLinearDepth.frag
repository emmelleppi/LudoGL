uniform sampler2D u_texture;
uniform float u_near;
uniform float u_far;

in vec2 v_uv;

out vec4 fragColor;

#include<gbufferUtils>

void main() {
    float zView = texture(u_texture, v_uv).r;
    float normalizedDepth = normalizeDepth(zView, u_near, u_far);
    fragColor = vec4(vec3(normalizedDepth), 1.0);
}
