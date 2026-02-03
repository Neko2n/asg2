// Shaders

// Input: an array of points comes from javascript.
// In this example, think of this array as the variable a_Position;
// Q: Why a_Position is not an array?
// A: Because the GPU process every vertex in parallel
// The language that we use to write the shaders is called GLSL

// Output: sends "an array of points" to the rasterizer.
var VERTEX_SHADER = `
    precision mediump float;

    attribute vec3 a_Color;
    varying vec3 v_Color;

    attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalMatrix;

    void main() {
        v_Color = a_Color;
        gl_Position = u_GlobalMatrix * u_ModelMatrix * a_Position;
    }
`;

// Input: a fragment (a grid of pixels) comes from the rasterizer.
// It doesn't have vertices as input
// Ouput: a color goes to HTML canvas.
var FRAGMENT_SHADER = `
    precision mediump float;

    varying vec3 v_Color;

    void main() {
        gl_FragColor = vec4(v_Color, 1.0);
    }
`;

const MAX_ZOOM = 2;
const POKE_ANIM_LENGTH = 3000; // In ms

g_GlobalRotateXMatrix = new Matrix4();
g_GlobalRotateYMatrix = new Matrix4();
g_GlobalScaleMatrix = new Matrix4();
g_LastFrame = 0;
g_FrameDelta = 0;
g_FrameCount = 0;
g_FPSCounter = null;
g_Frozen = false;
g_Poked = -POKE_ANIM_LENGTH;

Shapes = [];

// Animal parts
head = null; // root
beak = null;
eyeLeft = null;
eyeRight = null;
body = null;
wingLeft = null;
wingRight = null;
wingLeftOuter = null;
wingRightOuter = null;

// Draws geometry.
function renderScene() {
    let g_matrix = new Matrix4();
    g_matrix.multiply(g_GlobalRotateYMatrix);
    g_matrix.multiply(g_GlobalRotateXMatrix);
    g_matrix.multiply(g_GlobalScaleMatrix);
    gl.uniformMatrix4fv(u_GlobalMatrix, false, g_matrix.elements);
    for (const shape of Shapes) {
        shape.render();
    }
}

// Animates the model.
function animate() {
    if (g_Frozen === true) return;
    const t = performance.now();
    if (t - g_Poked < POKE_ANIM_LENGTH) {
        // Poking animation
        return;
    }
    // Idle animation
    const s = Math.sin(t/1000)/10;
    if (head instanceof geometry) {
        head.translate(0, s + 0.4, 0);
    }
    if (wingLeft instanceof geometry) {
        const [x, y, z] = wingLeft.getRotate();
        wingLeft.rotate(x, y, z);
    }
}

// Draws geometry and animates the model.
function tick() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw geometry
    renderScene();

    // Animate geometry
    animate();

    // Update FPS Counter
    g_FrameDelta += performance.now() - g_LastFrame;
    g_LastFrame = performance.now();
    g_FrameCount += 1;
    if (g_FrameDelta > 1000) {
        g_FPSCounter.innerText = g_FrameCount;
        g_FrameCount = 0;
        g_FrameDelta = 0;
    }

    requestAnimationFrame(tick);
}

function hookElements() {
    // Make camera rotate on drag
    let mouse_pos = [0, 0]
    let dragging = false;
    const sensitivity = 0.85;
    canvas.addEventListener('mousedown', (event) => {
        dragging = true;
        mouse_pos = [event.clientX, event.clientY];
        if (event.shiftKey) {
            g_Poked = performance.now(); // Start poke animation
        }
    });
    canvas.addEventListener('mousemove', (event) => {
        if (!dragging) return;
        const [ox, oy] = mouse_pos;
        const [dx, dy] = [event.clientX - ox, event.clientY - oy];
        const [dragX, dragY] = [dx * sensitivity, dy * sensitivity];
        g_GlobalRotateXMatrix.rotate(-dragY, 1, 0, 0);
        g_GlobalRotateYMatrix.rotate(-dragX, 0, 1, 0);
        mouse_pos = [event.clientX, event.clientY];
    });
    canvas.addEventListener('mouseup', (event) => {
        dragging = false;
    });
    canvas.addEventListener('mouseexit', (event) => {
        dragging = false;
    });

    // Make camera zoom on scroll
    canvas.addEventListener('wheel', (event) => {
        const zoom = (-event.deltaY) * 0.001 + 1;
        g_GlobalScaleMatrix.scale(zoom, zoom, zoom);
        event.preventDefault();
    });
    
    // FPS counter
    g_FPSCounter = document.getElementById("fps")

    // Animation toggle
    document.getElementById("toggle-anim")
        .addEventListener('mousedown', function() {
            g_Frozen = !g_Frozen;
        });
    
    // Part rotation sliders
    document.getElementById("slider-head")
        .addEventListener('mousemove', function() {
            let [x, y, z] = head.getRotate();
            if (this.value === y) return;
            head.rotate(x, this.value, z);
            [x, y, z] = body.getRotate();
            body.rotate(x, -this.value, z);
        });
    document.getElementById("slider-body")
        .addEventListener('mousemove', function() {
            let [x, y, z] = body.getRotate();
            if (this.value === z) return;
            body.rotate(x, y, this.value);
        });
}

function initGL() {
    canvas = document.getElementById("webgl");
    
    // Retrieve WebGl rendering context
    gl = getWebGLContext(canvas);
    if (!gl) {
        console.log("Failed to get WebGL context.")
        return -1;
    }

    gl.enable(gl.DEPTH_TEST);

    // A function to do all the drawing task outside of main
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Actually clear screen
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function defineShapes() {
    head = new cube(null, [1, 1, 1]);
    head.translate(0, 0.5, 0);
    head.scale(0.25, 0.25, 0.25);
    Shapes.push(head);
    RootShape = head;

    beak = new triangle(head, [1, 0.95, 0.8]);
    beak.translate(1.01, 0, 0);
    beak.scale(0.2, 0.2, 0.01);
    beak.rotate(180, 90, 0);
    Shapes.push(beak);

    eyeLeft = new triangle(head, [0.1, 0.1, 0.1]);
    eyeLeft.translate(0.3, 0.3, 1.01);
    eyeLeft.scale(.075, .15, 0.01);
    eyeLeft.rotate(0, 0, 270);
    Shapes.push(eyeLeft);

    eyeRight = new triangle(head, [0.1, 0.1, 0.1]);
    eyeRight.translate(0.3, 0.3, -1.01);
    eyeRight.scale(.075, .15, 0.01);
    eyeRight.rotate(0, 0, 270);
    Shapes.push(eyeRight);

    body = new cube(head, [0.2, 0.16, 0.15]);
    body.translate(0, -2.6, 0);
    body.scale(0.3, 0.4, 0.3);
    body.pivot(0, 0.5, 0);
    Shapes.push(body);

    wingLeft = new cube(body, [0.2, 0.16, 0.15]);
    wingLeft.translate(0, 5.2, -1);
    wingLeft.scale(0.01, 0.3, 0.3);
    wingLeft.rotate(0, -90, -30);
    Shapes.push(wingLeft);

    // wingRight = new cube(body, [0.2, 0.16, 0.15]);
    // wingRight.translate(0, 0, 0.45);
    // wingRight.scale(0.01, 0.3, 0.3);
    // wingRight.rotate(0, 90, -30);
    // Shapes.push(wingRight);

    // wingLeftOuter = new cube(wingLeft, [0.2, 0.16, 0.15]);
    // wingLeftOuter.translate(0, -0.5, 0);
    // wingLeftOuter.scale(0.01, 0.3, 0.3);
    // Shapes.push(wingLeftOuter);

    // wingRightOuter = new cube(wingRight, [0.2, 0.16, 0.15]);
    // wingRightOuter.translate(0, -0.5, 0);
    // wingRightOuter.scale(0.01, 0.3, 0.3);
    // Shapes.push(wingRightOuter);
}

function connectVariablesToGLSL() {
    // We have to compile the vertex and fragment shaders and
    // load them in the GPU
    if (!initShaders(gl, VERTEX_SHADER, FRAGMENT_SHADER)) {
        console.log("Failed to compile and load shaders.")
        return -1;
    }

    // Specify how to read points a, b and c from the triangle array
    // Create a WebGL buffer (an array in GPU memory), which is similar
    // to a javascript Array.
    let vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log("Can't create buffer");
        return -1;
    }

    // We have to bind this new buffer to the a_Position attribute in the
    // vertex shader.
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    // To map this ARRAY_BUFFER called vertexBuffer to our attribute a_Position
    // in the vertex shader.
    // To do that, we first need to access the memory location of the
    // attribute a_Position. Remember that a_Position is a variable in
    // the GPU memory. So we need to grab that location.
    let FLOAT_SIZE = Float32Array.BYTES_PER_ELEMENT;

    let a_Position = gl.getAttribLocation(gl.program, "a_Position");
    if (a_Position < 0) {
        console.log("Failed to get the storage location of a_Position.")
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 6 * FLOAT_SIZE, 0 * FLOAT_SIZE);
    gl.enableVertexAttribArray(a_Position);

    let a_Color = gl.getAttribLocation(gl.program, "a_Color");
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 6 * FLOAT_SIZE, 3 * FLOAT_SIZE);
    gl.enableVertexAttribArray(a_Color);

    u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    if (!u_ModelMatrix) {
        console.log("Failed to get the storage location of u_ModelMatrix.")
        return -1;
    }
    
    u_GlobalMatrix = gl.getUniformLocation(gl.program, "u_GlobalMatrix");
    if (!u_GlobalMatrix) {
        console.log("Failed to get the storage location of u_GlobalMatrix.")
        return -1;
    }
}

function main() {
    initGL();
    connectVariablesToGLSL();
    hookElements();
    defineShapes();
    tick();
}
