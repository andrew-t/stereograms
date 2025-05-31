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
    const patternX = Array.from({length:output.height}).map(() => Array.from({length:output.width}).map(() => null));

    // render right hand side
    for (let y = 0; y < output.height; ++y)
        for (let x = centre; x < depthCanvas.width; ++x) {
            const depth = depthAt(x, y);
            const offset = depth * patternCanvas.width;
            const targetX = x + patternCanvas.width;
            // If there's a value already in the pattern at the right point then just use that
            const fromPatternX = patternX[y][targetX - Math.round(offset)];
            if (fromPatternX !== null) {
                patternX[y][targetX] = fromPatternX;
                continue;
            }
            // If there's a value one pixel to the left we can iterate from then do that
            const fromNeighbour = patternX[y][targetX - 1];
            if (fromNeighbour !== null) {
                patternX[y][targetX] = fromNeighbour + 1 / depth;
                continue;
            }
            // lastly, oh well, just pick a value
            patternX[y][targetX] = 0;
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
            patternX[y][x - offset] = patternX[y][x];
            // now propagate right in case there was a gap
            for (let xx = x - offset + 1; patternX[y][xx] === null; ++xx)
                patternX[y][xx] = patternX[y][xx - 1] + 1;
        }

    // draw pattern data per our X values
    const outputData = ctx.getImageData(0, 0, output.width, output.height);
    const patternData = patternCanvas.getContext('2d').getImageData(0, 0, patternCanvas.width, patternCanvas.height);
    for (let y = 0; y < output.height; ++y) for (let x = 0; x < output.width; ++x) for (let channel = 0; channel < 4; ++channel) {
        const val = patternX[y][x];
        if (val === null) {
            // console.warn("val is null at", { x, y });
            continue;
        }
        outputData.data[(x + y * output.width) * 4 + channel] =
            patternData.data[(y * patternCanvas.width + Math.round(val)) * 4 + channel];
    }
    ctx.putImageData(outputData, 0, 0);

    function depthAt(x, y) {
        const depth = depthData.data[(x + y * depthCanvas.width) * 4 + 1] / 255;
        return whiteDepth * depth + blackDepth * (1 - depth);
    }
}
