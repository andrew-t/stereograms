export default async function makeStereogram({
	blackDepth,
	whiteDepth,
    patternScalingFactor = 1,
	destination: output, // this is a canvas element
	depthSource: depthCanvas, // also a canvas
	patternSource: patternCanvas, // also a canvas
    tilePattern
}) {
    const unscaledWidth = patternCanvas.width * patternScalingFactor + depthCanvas.width;
    output.width = output.offsetWidth * window.devicePixelRatio;
    const scalingFactor = output.width / unscaledWidth;
    output.height = depthCanvas.height * scalingFactor;
    const totalPatternScale = scalingFactor * patternScalingFactor;
    const scaledPatternWidth = totalPatternScale * patternCanvas.width;

    const ctx = output.getContext('2d');
    const depthData = depthCanvas.getContext('2d').getImageData(0, 0, depthCanvas.width, depthCanvas.height);
    /** A 1px-high image data the width of our target canvas */
    const anyRow = ctx.getImageData(0, 0, output.width, 1);
    const patternData = patternCanvas.getContext('2d').getImageData(0, 0, patternCanvas.width, patternCanvas.height);

    // Bit less than half because the right side looks nicer than the left
    const centre = Math.round(scalingFactor * depthCanvas.width * 0.4);
    
    // Process the image one row at a time
    for (let y = 0; y < depthCanvas.height; ++y) {
        const lowY = Math.round(y * scalingFactor);
        const highY = Math.round((y + 1) * scalingFactor);
        if (highY == lowY) continue;

        /** The x-values of this row */
        const patternX = Array.from({ length: output.width }).map(() => null);

        // render right hand side
        const end = output.width - scaledPatternWidth - 1;
        for (let x = Math.round(centre); x < end; ++x) {
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
                patternX[integerTargetX] = (fromNeighbour + 1 / (depth * totalPatternScale)) % patternCanvas.width;
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
            const depth = depthAt((x - scaledPatternWidth) / scalingFactor, y);
            const offset = Math.round(depth * scaledPatternWidth);
            if (offset == 0 || offset >= x) continue;
            patternX[x - offset] = patternX[x];
            // now propagate right in case there was a gap
            let gradient = null;
            for (let xx = x - offset + 1; patternX[xx] === null; ++xx) {
                if (gradient === null) gradient = 1 / (depth * totalPatternScale);
                patternX[xx] = (patternX[xx - 1] + gradient) % patternCanvas.width;
            }
        }

        // draw pattern data per our X values
        let lastYy = null;
        for (let y = lowY; y < highY; ++y) {
            const yy = tilePattern
                ? Math.floor(y / totalPatternScale) % patternCanvas.height
                : Math.floor(y * patternCanvas.height / output.height);
            if (yy != lastYy) {
                patternXToRgb(patternX, yy);
                lastYy = yy;
            }
            ctx.putImageData(anyRow, 0, y);
        }
    }

    /** x can be a float but y must be an integer */
    function depthAt(x, y) {
        x = Math.round(x);
        if (x < 0) x = 0;
        if (x >= depthCanvas.width) x = depthCanvas.width - 1;
        const depth = depthData.data[(x + y * depthCanvas.width) * 4 + 1] / 255;
        return whiteDepth * depth + blackDepth * (1 - depth);
    }

    function patternXToRgb(patternX, y) {
        for (let x = 0; x < output.width; ++x) {
            let val = patternX[x];
            if (val === null) continue;
            val = Math.round(val);
            const yy = y * patternCanvas.width;
            for (let channel = 0; channel < 4; ++channel)
                anyRow.data[x * 4 + channel] = patternData.data[(yy + val) * 4 + channel];
            
        }
    }
}
