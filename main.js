import "./image-getter.js";

async function makeStereogram() {
    const blackDepth = parseFloat(document.getElementById("black-depth").value);
    const whiteDepth = parseFloat(document.getElementById("white-depth").value);

    const output = document.getElementById("output");
    const depthCanvas = document.getElementById("depth").canvas;
    const patternCanvas = document.getElementById("pattern").canvas;

    output.width = patternCanvas.width + depthCanvas.width;
    output.height = depthCanvas.height;
    const ctx = output.getContext('2d');

    const depthData = depthCanvas.getContext('2d').getImageData(0, 0, depthCanvas.width, depthCanvas.height);

    const centre = ~~(depthCanvas.width / 2);

    for (let x = centre; x > -patternCanvas.width; x -= patternCanvas.width)
        drawPattern(x);

    const outputData = ctx.getImageData(0, 0, output.width, output.height);

    // render right hand side
    for (let x = centre; x < depthCanvas.width; ++x)
        for (let y = 0; y < output.height; ++y) {
            // round and multiply by four because there are four values per pixel in the data array
            const offset = Math.round(depthAt(x, y) * patternCanvas.width) * 4;
            for (let channel = 0; channel < 4; ++channel) {
                const i = (x + patternCanvas.width + y * output.width) * 4 + channel;
                // Each pixel is the colour of the pixel fn(depth) pixels to the left
                outputData.data[i] = outputData.data[i - offset];
            }
        }

    // render left hand side
    // Each pixel should still be the colour of the pixel fn(depth) pixels to the left
    // but we haven't coloured the left yet, so we need to fake it somehow
    // so imagine this line and we want to fill in the *
    // _ _ _ _ _ _ _ * 1 2 3 4 1 2 3 1 2 3 1 1 2 3 1
    // we actually need to process the pixels to its right and propagate their colours back
    for (let x = centre + patternCanvas.width * 2; x >= 0; --x)
        for (let y = 0; y < output.height; ++y) {
            const offset = Math.round(depthAt(x - patternCanvas.width, y) * patternCanvas.width);
            if (offset == 0 || offset >= x) continue;
            for (let channel = 0; channel < 4; ++channel) {
                const i = (x + y * output.width) * 4 + channel;
                // Each pixel is the colour of the pixel fn(depth) pixels to the left
                outputData.data[i - offset * 4] = outputData.data[i];
            }
        }

    ctx.putImageData(outputData, 0, 0);

    function depthAt(x, y) {
        const depth = depthData.data[(x + y * depthCanvas.width) * 4 + 1] / 255;
        return whiteDepth * depth + blackDepth * (1 - depth);
    }

    function drawPattern(x) {
        ctx.drawImage(patternCanvas, 0, 0, patternCanvas.width, patternCanvas.height, x, 0, patternCanvas.width, output.height);
    }
}

async function generate() {
    document.getElementById("pattern").height.value = document.getElementById("depth").height.value;
    await makeStereogram();
    document.getElementById("save").setAttribute("href", document.getElementById("output").toDataURL());
}

document.getElementById("form").addEventListener("submit", e => {
    e.preventDefault();
    generate();
});

function debounced(fn, delay = 500) {
    let timer = null;
    return () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(fn, delay);
    };
}

const debouncedGenerate = debounced(generate, 500);

const els = [ "depth", "pattern", "black-depth", "white-depth" ];
for (const el of els) document.getElementById(el).addEventListener("change", debouncedGenerate);

document.getElementById("depth").addEventListener("change", () => {
    const pattern = document.getElementById("pattern");
    pattern.height.value = document.getElementById("depth").height.value;
    pattern.update();
});

function drawDepthGraph() {
    const canvas = document.getElementById("depth-graph");
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, (1 - document.getElementById("black-depth").value) * canvas.height);
    ctx.lineTo(canvas.width, (1 - document.getElementById("white-depth").value) * canvas.height);
    ctx.stroke();
}
document.getElementById("black-depth").addEventListener("input", drawDepthGraph);
document.getElementById("white-depth").addEventListener("input", drawDepthGraph);
drawDepthGraph();
