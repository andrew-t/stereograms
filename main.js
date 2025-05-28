import "./image-getter.js";
import "./view-stereogram.js";

async function makeStereogram() {
    const depthCanvas = document.getElementById("depth").canvas;
    const patternCanvas = document.getElementById("pattern").canvas;

    const viewer = document.createElement("view-stereogram"),
        oldViewer = document.getElementById("viewer");
    viewer.id = "viewer";
    viewer.setAttribute("depth-src", depthCanvas.toDataURL());
    viewer.setAttribute("pattern-src", patternCanvas.toDataURL());
    viewer.setAttribute("contrast", oldViewer.contrastSlider.value);
    viewer.classList.add("no-width");
    oldViewer.replaceWith(viewer);
    if (oldViewer.hasAttribute("invert") != oldViewer.invertCheckbox.checked) viewer.invertCheckbox.checked = true;
}

async function generate() {
    document.getElementById("pattern").height.value = document.getElementById("depth").height.value;
    await makeStereogram();
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

const els = [ "depth", "pattern" ];
for (const el of els) document.getElementById(el).addEventListener("change", debouncedGenerate);

document.getElementById("depth").addEventListener("change", () => {
    const pattern = document.getElementById("pattern");
    pattern.height.value = document.getElementById("depth").height.value;
    pattern.update();
});
