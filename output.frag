#version 300 es
precision highp float;

uniform sampler2D tex;

in vec2 texcoord;

out vec4 frag;

void main()
{
    vec4 color = vec4(texture(tex, texcoord));

    // frag = vec4(color.rgb, 1.0 - color.a); // premultipliedAlpha: true
    frag = vec4(color.rgb / (1.0 - color.a), 1.0 - color.a); // premultipliedAlpha: false
}