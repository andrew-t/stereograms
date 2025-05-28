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

    _input(labelText, attrs = {}, onChange = null, labelAttrs = {}) {
        const label = document.createElement("label");
        const span = document.createElement("span");
        span.appendChild(document.createTextNode(labelText));
        label.appendChild(span);
        this.fieldset.appendChild(label);
        const input = document.createElement("input");
        doAttrs(input, attrs);
        doAttrs(label, labelAttrs);
        label.appendChild(input);
        input.addEventListener("change", onChange);
        return input;
    }
}

function doAttrs(el, attrs) {
    for (const attr in attrs) {
        const val = attrs[attr];
        if (val === true) el.setAttribute(attr, attr);
        else if (val === false) el.removeAttribute(attr);
        else el.setAttribute(attr, val.toString());
    }
}
