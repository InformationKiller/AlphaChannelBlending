window.onload = function() {
    var canvas = document.createElement('canvas');

    canvas.width = 800;
    canvas.height = 800;

    document.body.appendChild(canvas);

    var GLES = canvas.getContext('webgl2', {
        premultipliedAlpha: true,
        alpha: true
    });

    var quadVBO = GLES.createBuffer();
    var screenVBO = GLES.createBuffer();

    GLES.bindBuffer(GLES.ARRAY_BUFFER, quadVBO);
    GLES.bufferData(GLES.ARRAY_BUFFER, new Float32Array([
        -1.0, -1.0, 0.0, 0.0, 1.0,
        0.4, -1.0, 0.0, 0.0, 1.0,
        -1.0, 0.4, 0.0, 0.0, 1.0,
        0.4, 0.4, 0.0, 0.0, 1.0,

        -0.7, -0.7, 0.0, 1.0, 0.0,
        0.7, -0.7, 0.0, 1.0, 0.0,
        -0.7, 0.7, 0.0, 1.0, 0.0,
        0.7, 0.7, 0.0, 1.0, 0.0,

        -0.4, -0.4, 1.0, 0.0, 0.0,
        1.0, -0.4, 1.0, 0.0, 0.0,
        -0.4, 1.0, 1.0, 0.0, 0.0,
        1.0, 1.0, 1.0, 0.0, 0.0,
    ]), GLES.STATIC_DRAW);

    GLES.bindBuffer(GLES.ARRAY_BUFFER, screenVBO);
    GLES.bufferData(GLES.ARRAY_BUFFER, new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        1.0, 1.0
    ]), GLES.STATIC_DRAW);

    var FBO = GLES.createFramebuffer();
    var TEX = GLES.createTexture();

    GLES.bindFramebuffer(GLES.FRAMEBUFFER, FBO);
    GLES.bindTexture(GLES.TEXTURE_2D, TEX);

    GLES.texImage2D(GLES.TEXTURE_2D, 0, GLES.RGBA, 800, 800, 0, GLES.RGBA, GLES.UNSIGNED_BYTE, null);
    GLES.texParameteri(GLES.TEXTURE_2D, GLES.TEXTURE_MAG_FILTER, GLES.LINEAR);
    GLES.texParameteri(GLES.TEXTURE_2D, GLES.TEXTURE_MIN_FILTER, GLES.LINEAR);
    GLES.framebufferTexture2D(GLES.FRAMEBUFFER, GLES.COLOR_ATTACHMENT0, GLES.TEXTURE_2D, TEX, 0);

    GLES.bindTexture(GLES.TEXTURE_2D, null);
    GLES.bindFramebuffer(GLES.FRAMEBUFFER, null);

    var QUAD = GLES.createProgram();
    var OUTPUT = GLES.createProgram();
    var compiled = new Map();

    compiled.set(QUAD, 0);
    compiled.set(OUTPUT, 0);

    fetch('./quad.vert').then(resp => resp.text()).then(text => compile(QUAD, GLES.VERTEX_SHADER, text)).then(() => link(QUAD)).then(() => finish());
    fetch('./quad.frag').then(resp => resp.text()).then(text => compile(QUAD, GLES.FRAGMENT_SHADER, text)).then(() => link(QUAD)).then(() => finish());
    fetch('./output.vert').then(resp => resp.text()).then(text => compile(OUTPUT, GLES.VERTEX_SHADER, text)).then(() => link(OUTPUT)).then(() => finish());
    fetch('./output.frag').then(resp => resp.text()).then(text => compile(OUTPUT, GLES.FRAGMENT_SHADER, text)).then(() => link(OUTPUT)).then(() => finish());

    var compile = function(program, type, source) {
        let shader = GLES.createShader(type);

        GLES.shaderSource(shader, source);
        GLES.compileShader(shader);

        if (!GLES.getShaderParameter(shader, GLES.COMPILE_STATUS)) {
            console.error(GLES.getShaderInfoLog(shader));
            GLES.deleteShader(shader);

            return;
        }

        GLES.attachShader(program, shader);
        GLES.deleteShader(shader);

        compiled.set(program, compiled.get(program) + 1);
    }

    var link = function(program) {
        if (compiled.get(program) == 2) {
            GLES.linkProgram(program);

            if (!GLES.getProgramParameter(program, GLES.LINK_STATUS)) {
                console.error(GLES.getProgramInfoLog(program));

                return;
            }

            GLES.validateProgram(program);

            if (!GLES.getProgramParameter(program, GLES.VALIDATE_STATUS)) {
                console.error(GLES.getProgramInfoLog(program));

                return;
            }

            compiled.set(program, compiled.get(program) + 1);
        }
    }

    var finish = function() {
        if (compiled.get(QUAD) == 3 && compiled.get(OUTPUT) == 3) {
            var vertex = GLES.getAttribLocation(QUAD, 'vertex');
            var color = GLES.getAttribLocation(QUAD, 'color');
            var vetexOutput = GLES.getAttribLocation(OUTPUT, 'vertex');
            var tex = GLES.getUniformLocation(OUTPUT, 'tex');

            GLES.bindFramebuffer(GLES.FRAMEBUFFER, FBO);
            GLES.viewport(0, 0, 800, 800);
            GLES.drawBuffers([GLES.COLOR_ATTACHMENT0]);

            GLES.bindBuffer(GLES.ARRAY_BUFFER, quadVBO);
            GLES.vertexAttribPointer(vertex, 2, GLES.FLOAT, false, 20, 0);
            GLES.enableVertexAttribArray(vertex);
            GLES.vertexAttribPointer(color, 3, GLES.FLOAT, false, 20, 8);
            GLES.enableVertexAttribArray(color);

            GLES.useProgram(QUAD);

            GLES.clearColor(0.0, 0.0, 0.0, 1.0); // IMPORTANT
            GLES.clear(GLES.COLOR_BUFFER_BIT);

            GLES.enable(GLES.BLEND);
            GLES.blendFuncSeparate(GLES.SRC_ALPHA, GLES.ONE_MINUS_SRC_ALPHA, GLES.ZERO, GLES.ONE_MINUS_SRC_ALPHA); // IMPORTANT

            GLES.drawArrays(GLES.TRIANGLE_STRIP, 0, 4);
            GLES.drawArrays(GLES.TRIANGLE_STRIP, 4, 4);
            GLES.drawArrays(GLES.TRIANGLE_STRIP, 8, 4);

            GLES.disableVertexAttribArray(vertex);
            GLES.disableVertexAttribArray(color);

            GLES.bindFramebuffer(GLES.FRAMEBUFFER, null);
            GLES.viewport(0, 0, 800, 800);
            GLES.drawBuffers([GLES.BACK]);

            GLES.bindBuffer(GLES.ARRAY_BUFFER, screenVBO);
            GLES.vertexAttribPointer(vetexOutput, 2, GLES.FLOAT, false, 0, 0);
            GLES.enableVertexAttribArray(vetexOutput);

            GLES.useProgram(OUTPUT);

            GLES.activeTexture(GLES.TEXTURE0);
            GLES.bindTexture(GLES.TEXTURE_2D, TEX);
            GLES.uniform1i(tex, 0);

            GLES.disable(GLES.BLEND);

            GLES.drawArrays(GLES.TRIANGLE_STRIP, 0, 4);

            GLES.disableVertexAttribArray(vetexOutput);

            GLES.useProgram(null);
            GLES.bindTexture(GLES.TEXTURE_2D, null);
            GLES.bindBuffer(GLES.ARRAY_BUFFER, null);

            GLES.deleteProgram(OUTPUT);
            GLES.deleteProgram(QUAD);
            GLES.deleteFramebuffer(FBO);
            GLES.deleteTexture(TEX);
            GLES.deleteBuffer(screenVBO);
            GLES.deleteBuffer(quadVBO);

            document.documentElement.style.transition = 'background-color 3s ease-in-out 0s';

            setInterval(() => {
                document.documentElement.style.backgroundColor = 'rgb(' + (Math.random() * 255) + ',' + (Math.random() * 255) + ',' + (Math.random() * 255) + ')';
            }, 3000);
        }
    }
};