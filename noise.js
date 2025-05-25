export default function addNoise(canvas, ctx, intensity = 255, offset = 0, greyscale = false) {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let x = 0; x < canvas.width; ++x)
        for (let y = 0; y < canvas.height; ++y) {
            let noiseLevel;
            for (let channel = 0; channel < 3; ++channel) {
                if (!channel || !greyscale) noiseLevel = offset + ~~(Math.random() * intensity)
                data.data[(x + y * canvas.width) * 4 + channel] += noiseLevel;
            }
        }
    ctx.putImageData(data, 0, 0);
}
