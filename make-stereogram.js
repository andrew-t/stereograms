export default async function makeStereogram({
	blackDepth,
	whiteDepth,
    patternScalingFactor = 1,
	destination: output, // this is a canvas element
	depthSource: depthCanvas, // also a canvas
	patternSource: patternCanvas // also a canvas
}) {
    const unscaledWidth = patternCanvas.width + depthCanvas.width;
    output.width = output.offsetWidth * window.devicePixelRatio ;
    const scalingFactor = output.width  / unscaledWidth;
    output.height = depthCanvas.height * scalingFactor;
    const scaledPatternWidth = scalingFactor * patternScalingFactor * patternCanvas.width;

    const ctx = output.getContext('2d');
    const depthData = depthCanvas.getContext('2d').getImageData(0, 0, depthCanvas.width, depthCanvas.height);
    /** A 1px-high image data the width of our target canvas */
    const anyRow = ctx.getImageData(0, 0, output.width, 1);
    const patternData = patternCanvas.getContext('2d').getImageData(0, 0, patternCanvas.width, patternCanvas.height);

    const centre = ~~(scalingFactor * depthCanvas.width / 2);
    
    // Process the image one row at a time
    for (let y = 0; y < depthCanvas.height; ++y) {
        const lowY = Math.round(y * scalingFactor);
        const highY = Math.round((y + 1) * scalingFactor);
        if (highY == lowY) continue;

        /** The x-values of this row */
        const patternX = Array.from({ length:output.width }).map(() => null);

        // render right hand side
        for (let x = Math.round(centre); x < scalingFactor * depthCanvas.width; ++x) {
            const depth = depthAt(x / scalingFactor, y);
            const offset = depth * scaledPatternWidth;
            const targetX = x + scaledPatternWidth;
            const integerTargetX = Math.round(targetX);
            // If there's a value already in the pattern at the right point then just use that
            const fromPatternX = patternX[Math.round(targetX - offset)];
            if (fromPatternX !== null) {
                patternX[integerTargetX] = fromPatternX;
                continue;
            }
            // If there's a value one pixel to the left we can iterate from then do that
            const fromNeighbour = patternX[integerTargetX - 1];
            if (fromNeighbour !== null) {
                patternX[integerTargetX] = fromNeighbour + 1 / (depth / (scalingFactor * patternScalingFactor));
                continue;
            }
            // lastly, oh well, just pick a value
            patternX[integerTargetX] = 0;
        }

        // render left hand side
        // Each pixel should still be the colour of the pixel fn(depth) pixels to the left
        // but we haven't coloured the left yet, so we need to fake it somehow
        // so imagine this line and we want to fill in the *
        // _ _ _ _ _ _ _ * 1 2 3 4 1 2 3 1 2 3 1 1 2 3 1
        // we actually need to process the pixels to its right and propagate their colours back
        for (let x = Math.round(centre + scaledPatternWidth * 2); x >= 0; --x) {
            const offset = Math.round(depthAt((x - scaledPatternWidth) / scalingFactor, y) * scaledPatternWidth);
            if (offset == 0 || offset >= x) continue;
            patternX[x - offset] = patternX[x];
            // now propagate right in case there was a gap
            for (let xx = x - offset + 1; patternX[xx] === null; ++xx)
                patternX[xx] = patternX[xx - 1] + patternScalingFactor;
        }

        // draw pattern data per our X values
        for (let x = 0; x < output.width; ++x) for (let channel = 0; channel < 4; ++channel) {
            const val = patternX[x];
            if (val === null) {
                // console.warn("val is null at", { x, y });
                continue;
            }
            anyRow.data[x * 4 + channel] =
                patternData.data[(y * patternCanvas.width + Math.round(val)) * 4 + channel];
        }
        for (let y = lowY; y < highY; ++y) {
            // console.log('y', y, anyRow);
            ctx.putImageData(anyRow, 0, y);
        }
    }

    /** x can be a float but y must be an integer */
    function depthAt(x, y) {
        if (x < 0) x = 0;
        if (x > depthCanvas.width - 1) x = depthCanvas.width - 1;
        const depth = depthData.data[(Math.round(x) + y * depthCanvas.width) * 4 + 1] / 255;
        return whiteDepth * depth + blackDepth * (1 - depth);
    }
}
