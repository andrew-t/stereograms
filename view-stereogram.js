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

    	const depthSourcePromise = urlToCanvas(this.getAttribute("depth-src"));
    	const patternSourcePromise = urlToCanvas(this.getAttribute("pattern-src"));

    	this.update = async () => {
    		const contrast = this.contrastSlider.value;
    		const isInverted = invert != !!this.invertCheckbox.checked;
			await make({
				blackDepth: isInverted ? 1 : (1 - contrast),
				whiteDepth: isInverted ? 1 - contrast : 1,
				depthSource: await depthSourcePromise,
				patternScalingFactor: parseFloat(this.patternWidthSlider.value),
				patternSource: await patternSourcePromise,
				destination
			});
			saveLink.href = destination.toDataURL();
    	};

    	this.invertCheckbox = this._input("Invert", { type: "checkbox" }, this.update, { class: "invert" });
    	this.showDepthMap = this._input("Cheat", { type: "checkbox" }, this.update, { class: "show-depth" });
    	this.contrastSlider = this._input("3D", { type: "range", orient: "vertical", min: 0, max: 1, step: "any", value: parseFloat(this.getAttribute("contrast") ?? "0.35") }, this.update, { class: "contrast" });
    	this.patternWidthSlider = this._input("Pattern width", { type: "range", orient: "horizontal", min: 0, max: 5, value: 1, step: "any" }, this.update, { class: "pattern-width" });
    	this.fieldset.appendChild(destination);
    	depthSourcePromise.then(canvas => {
			this.fieldset.appendChild(canvas);
			canvas.classList.add("depth");
		});

		destination.tabIndex = 0;
		destination.setAttribute("aria-label", "Click for fullscreen");
		destination.addEventListener("click", () => this.requestFullscreen());

    	setTimeout(this.update, 50);

		this.addEventListener("fullscreenchange", this.update);
		window.addEventListener("resize", this.update);
    }

	disconnectedCallback() {
		window.removeEventListener("resize", this.update);
	}
}

customElements.define('view-stereogram', ViewStereogram);

async function urlToCanvas(url) {
	if (!url) return document.createElement("canvas");
	try {
		const image = await new Promise((resolve, reject) => {
			const image = new Image();
			image.addEventListener("load", () => resolve(image));
			image.addEventListener("error", reject);
			image.src = url;
		});
		const canvas = document.createElement("canvas");
		canvas.width = Math.round(image.naturalWidth);
		canvas.height = image.naturalHeight;
		const ctx = canvas.getContext('2d');
		ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, canvas.width, canvas.height);
		return canvas;
	} catch (e) {
		console.error(e);
		return document.createElement("canvas");
	}
}
