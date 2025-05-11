uniform sampler2D u_texture;
uniform float u_near;
uniform float u_far;

in vec2 v_uv;

out vec4 fragColor;

#include<gbufferUtils>

void main() {
    float d  = texture(u_texture, v_uv).r;
    float ld = linearizeDepth(d, u_near, u_far);
    float v = normalizeDepth(ld, u_near, u_far);
    fragColor = vec4(vec3(v), 1.0);
}
