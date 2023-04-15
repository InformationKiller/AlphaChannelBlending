#version 300 es
precision highp float;

in vec3 vcolor;

out vec4 frag;

void main()
{
    frag = vec4(vcolor, 0.5);
}