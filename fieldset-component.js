export default class FieldsetComponent extends HTMLElement {
	_initFieldset() {
        this.fieldset = document.createElement("fieldset");
        this.appendChild(this.fieldset);

        const legend = document.createElement("legend"); // hello you absolute legend
        legend.textContent = this.getAttribute("legend");
        this.fieldset.appendChild(legend);
	}

    _button(labelText, onClick) {
        const button = document.createElement("button");
        button.setAttribute("type", "button");
        button.textContent = labelText;
        button.addEventListener("click", onClick);
        this.fieldset.appendChild("button");
        return button;
    }

    _input(labelText, attrs = {}, onChange) {
        const label = document.createElement("label");
        const span = document.createElement("span");
        span.appendChild(document.createTextNode(labelText));
        label.appendChild(span);
        this.fieldset.appendChild(label);
        const input = document.createElement("input");
        for (const attr in attrs) {
            const val = attrs[attr];
            if (val === true) input.setAttribute(attr, attr);
            else if (val === false) input.removeAttribute(attr);
            else input.setAttribute(attr, val.toString());
        }
        label.appendChild(input);
        input.addEventListener("change", onChange);
        return input;
    }
}