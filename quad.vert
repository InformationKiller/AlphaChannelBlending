#version 300 es
precision highp float;

in vec2 vertex;
in vec3 color;

out vec3 vcolor;

void main()
{
    vcolor = color;

    gl_Position = vec4(vertex, 0.0, 1.0);
}