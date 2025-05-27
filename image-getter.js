import addNoise from "./noise.js";
import FieldsetComponent from "./fieldset-component.js";

class ImageGetter extends FieldsetComponent {

    // connect component
    connectedCallback() {
        this._initFieldset();
        
        this.update = () => {
            this.canvas.width = parseInt(this.width.value, 10);
            this.canvas.height = parseInt(this.height.value, 10);
            const ctx = this.canvas.getContext('2d');
            ctx.fillStyle = "#808080";
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            if (this.imported.complete && this.imported.naturalWidth) {
                if (this.repeatImage?.checked) {
                    const h = Math.round(this.imported.naturalHeight * this.canvas.width / this.imported.naturalWidth);
                    if (h < 5) h = 5;
                    for (let y = 0; y < this.canvas.height; y += h)
                        ctx.drawImage(this.imported,
                            0, 0, this.imported.naturalWidth, this.imported.naturalHeight,
                            0, y, this.canvas.width, h);
                }
                else ctx.drawImage(this.imported,
                    0, 0, this.imported.naturalWidth, this.imported.naturalHeight,
                    0, 0, this.canvas.width, this.canvas.height);
            }
                
            if (this.contrastStretch.checked) {
                const data = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                let min = 255, max = 0;
                for (let x = 0; x < this.canvas.width; ++x)
                    for (let y = 0; y < this.canvas.height; ++y)
                        for (let channel = 0; channel < 3; ++channel) {
                            const val = data.data[(x + y * this.canvas.width) * 4 + channel];
                            if (val > max) max = val;
                            if (val < min) min = val;
                        }
                for (let x = 0; x < this.canvas.width; ++x)
                    for (let y = 0; y < this.canvas.height; ++y)
                        for (let channel = 0; channel < 3; ++channel) {
                            const i = (x + y * this.canvas.width) * 4 + channel;
                            data.data[i] = (data.data[i] - min) / (max - min) * 255;
                        }
                ctx.putImageData(data, 0, 0);
            }
            if (this.getAttribute("noise") != "off")
                addNoise(this.canvas, ctx, this.noiseLevel.value * 255, this.noiseLevel.value * -128, this.greyNoise.checked);
            this.dispatchEvent(new CustomEvent("change"));
        };

        this.imported = new Image();
        this.imported.addEventListener("error", e => {
            console.error("e");
            alert("Unable to import image");
        });
        this.imported.addEventListener("load", () => {
            this.width.value = this.imported.naturalWidth;
            this.height.value = this.imported.naturalHeight;
            this.update();
        });
        this.fieldset.appendChild(this.imported);

        this.importer = this._input("Image file", { type: "file" }, e => {
            const { files } = e.target;
            if (files.length !== 1) return;
            const [ file ] = files;
            const reader = new FileReader();
            reader.addEventListener("load", () => this.imported.src = reader.result);
            reader.readAsDataURL(file);
        });
        if (this.getAttribute("noise") != "off") {
            this.repeatImage = this._input("Repeat image", { type: "checkbox" }, this.update);
        }

        this.width = this._input("Width", { type: "number", min: 10, value: this.getAttribute("width") || 100 }, this.update);
        this.height = this._input("Height", { type: "number", min: 10, value: this.getAttribute("height") || 100, disabled: this.getAttribute("noise") != "off" }, this.update);
        if (this.getAttribute("noise") != "off") {
            this.greyNoise = this._input("Greyscale noise", { type: "checkbox" }, this.update);
            this.noiseLevel = this._input("Noise level", { type: "number", min: 0, max: 1, step: "any", value: 1 }, this.update);
        }
        this.contrastStretch = this._input("Contrast stretch", { type: "checkbox", checked: this.hasAttribute("contrast-stretch") }, this.update);
        this.canvas = document.createElement("canvas");
        this.fieldset.appendChild(this.canvas);

        this.update();
    }
}

customElements.define('image-getter', ImageGetter);
