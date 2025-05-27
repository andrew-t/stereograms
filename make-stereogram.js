export default async function makeStereogram({
	blackDepth,
	whiteDepth,
	destination: output, // this is a canvas element
	depthSource: depthCanvas, // also a canvas
	patternSource: patternCanvas // also a canvas
}) {
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
