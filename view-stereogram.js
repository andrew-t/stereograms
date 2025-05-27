import make from "./make-stereogram.js";
import FieldsetComponent from "./fieldset-component.js";

class ViewStereogram extends FieldsetComponent {
    connectedCallback() {
    	this._initFieldset();

    	const invert = this.hasAttribute("invert");
    	const destination = document.createElement("canvas");
    	const saveLink = document.createElement("a");
    	saveLink.innerText = "Save";
    	saveLink.setAttribute("download", "download");
    	this.fieldset.appendChild(saveLink);

    	this.update = async () => {
	    	const depthSource = await urlToCanvas(this.getAttribute("depth-src"));
	    	const patternSource = await urlToCanvas(this.getAttribute("pattern-src"), this.patternWidthSlider.value);
    		const contrast = this.contrastSlider.value;
    		const isInverted = invert != !!this.invertCheckbox.checked;
			await make({
				blackDepth: isInverted ? 1 : (1 - contrast),
				whiteDepth: isInverted ? 1 - contrast : 1,
				depthSource,
				patternSource,
				destination
			});
			saveLink.href = destination.toDataURL();
    	};

    	this.invertCheckbox = this._input("Invert", { type: "checkbox" }, this.update);
    	this.contrastSlider = this._input("3D", { type: "range", orient: "vertical", min: 0, max: 1, step: "any", value: parseFloat(this.getAttribute("contrast") ?? "0.35") }, this.update);
    	this.patternWidthSlider = this._input("Pattern width", { type: "range", orient: "horizontal", min: 0, max: 1, value: 1, step: "any" }, this.update);
    	this.fieldset.appendChild(destination);

    	void this.update();
    }
}

customElements.define('view-stereogram', ViewStereogram);

async function urlToCanvas(url, widthMultiplier = 1) {
	if (!url) return document.createElement("canvas");
	try {
		const image = await new Promise((resolve, reject) => {
			const image = new Image();
			image.addEventListener("load", () => resolve(image));
			image.addEventListener("error", reject);
			image.src = url;
		});
		const canvas = document.createElement("canvas");
		canvas.width = Math.round(image.naturalWidth * widthMultiplier);
		canvas.height = image.naturalHeight;
		const ctx = canvas.getContext('2d');
		ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, canvas.width, canvas.height);
		return canvas;
	} catch (e) {
		console.error(e);
		return document.createElement("canvas");
	}
}
