// spec could be { url: 'https://...', w: 100, h: 200 }, which itself could be data encoded, or { w: 100, h: 200 } for random noise
function getImage(canvasId, spec) {
    const canvas = document.getElementById(canvasId);
    canvas.width = spec.w;
    canvas.height = spec.h;
    const ctx = canvas.getContext('2d');

    if (spec.url)
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.addEventListener("error", reject);
            img.addEventListener("load", () => {
                canvas.width = spec.w;
                canvas.height = spec.h;
                ctx.drawImage(img, 0, 0, spec.w, spec.h);
                resolve();
            });
            img.src = spec.url;
        });
    
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, spec.w, spec.h);
    addNoise(canvasId);
}

// this will also be used to noise-up pattern images
function addNoise(canvasId = "pattern", intensity = 255, offset = 0, greyscale = false) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let x = 0; x < canvas.width; ++x)
        for (let y = 0; y < canvas.height; ++y) {
            for (let channel = 0; channel < 3; ++channel)
                data.data[(x + y * canvas.width) * 4 + channel] += offset + ~~(Math.random() * intensity);
        }
    ctx.putImageData(data, 0, 0);
}

async function makeStereogram() {
    const multiplier = parseFloat(document.getElementById("multiplier").value);
    const depthOffset = parseFloat(document.getElementById("offset").value);
    const inverted = document.getElementById("depth-inverted").checked;
    const iterations = parseInt(document.getElementById("iterations").value, 10);

    const output = document.getElementById("output");
    const depthCanvas = document.getElementById("scene");
    const patternCanvas = document.getElementById("pattern");

    const extraWidth = Math.round(0.5 * patternCanvas.width);

    output.width = depthCanvas.width + extraWidth;
    output.height = depthCanvas.height;
    const ctx = output.getContext('2d');

    const depthData = depthCanvas.getContext('2d').getImageData(0, 0, depthCanvas.width, depthCanvas.height);

    const centre = ~~(depthCanvas.width / 2);

    for (let x = centre; x > -patternCanvas.width; x -= patternCanvas.width)
        drawPattern(x);

    const outputData = ctx.getImageData(0, 0, output.width, output.height);

    for (let i = 0; i < iterations; ++i) {
        for (let x = centre; x < depthCanvas.width; ++x)
            applyColumn(x, x + extraWidth, -1);
        for (let x = centre; x >= 0; --x)
            applyColumn(x, x, 1);
    }

    ctx.putImageData(outputData, 0, 0);

    function drawPattern(x) {
        ctx.drawImage(patternCanvas, x, 0, patternCanvas.width, output.height);
    }

    function applyColumn(depthX, outputX, direction = -1) {
        if (outputX >= output.width || outputX < 0) return;
        for (let y = 0; y < output.height; ++y) {   
            let depth = depthData.data[(depthX + y * depthCanvas.width) * 4 + 1] / 255;
            if (inverted) depth = (1 - depth);
            depth = 1 - multiplier * (1 - depth) + depthOffset;
            const offset = depth * direction * patternCanvas.width;
            for (let channel = 0; channel < 4; ++channel)
                outputData.data[(outputX + y * output.width) * 4 + channel] =
                    outputData.data[(outputX + Math.round(offset) + y * output.width) * 4 + channel];
        }
    }
}

async function generate() {
    await getImage("scene", {
        url: document.getElementById("depth-url").value,
        w: parseInt(document.getElementById("depth-w").value, 10),
        h: parseInt(document.getElementById("depth-h").value, 10)
    });
    await getImage("pattern", {
        w: parseInt(document.getElementById("pattern-w").value, 10),
        h: parseInt(document.getElementById("pattern-h").value, 10)
    });
    await makeStereogram();
}

document.getElementById("form").addEventListener("submit", e => {
    e.preventDefault();
    generate();
});
