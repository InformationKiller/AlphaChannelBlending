#version 300 es
precision highp float;

in vec2 vertex;

out vec2 texcoord;

void main()
{
    texcoord = vertex * 0.5 + 0.5;

    gl_Position = vec4(vertex, 0.0, 1.0);
}