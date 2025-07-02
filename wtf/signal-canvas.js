const d = class d {
  constructor(t, e) {
    this.subs = /* @__PURE__ */ new Set(), this.sources = /* @__PURE__ */ new Set(), this.allSources = /* @__PURE__ */ new Set(), this.isDirty = !1, this.name = e, this.setValue(t);
  }
  setValue(t) {
    if (!(t instanceof Function)) throw new Error("Getter must be function");
    this.getter = t, this.markDirty();
  }
  markDirty() {
    if (!this.isDirty) {
      this.isDirty = !0;
      for (const t of this.subs)
        t instanceof d ? t.markDirty() : t(this);
    }
  }
  static currentGetValueContext() {
    return this.getValueContextStack[this.getValueContextStack.length - 1] ?? null;
  }
  getValue() {
    const t = d.currentGetValueContext();
    if (t) {
      if (this.allSources.has(t.signal))
        throw new Error(`Circular dependency: ${t.signal} in ${this}`);
      t.newSources.add(this);
    }
    if (this.isDirty) {
      const e = {
        newSources: /* @__PURE__ */ new Set(),
        signal: this
      };
      d.getValueContextStack.push(e);
      try {
        this.value = this.getter();
      } finally {
        d.getValueContextStack.pop();
      }
      for (const s of this.sources)
        e.newSources.has(s) || s.unsubscribe(this);
      for (const s of e.newSources)
        this.sources.has(s) || s.subscribe(this);
      this.sources = e.newSources, this.isDirty = !1, this.allSources = /* @__PURE__ */ new Set([
        ...this.sources,
        ...[...this.sources].flatMap((s) => [...s.allSources])
      ]);
    }
    return this.value;
  }
  subscribe(t, e = {}) {
    this.subs.add(t), e.runNow && t(this);
  }
  unsubscribe(t) {
    this.subs.delete(t);
  }
  toString() {
    return `Signal(${this.name ?? "value"} = ${this.isDirty ? "???" : this.value})`;
  }
  /** equivalent to "await" — give it a signal and it'll give you the value, give it anything else and it'll give you the argument back out */
  static value(t) {
    return t instanceof d ? t.getValue() : t;
  }
  /** Subscribes if the first param is a signal, otherwise does nothing */
  static subscribe(t, e) {
    t instanceof d && t.subscribe(e);
  }
  /** Unsubscribes if the first param is a signal, otherwise does nothing */
  static unsubscribe(t, e) {
    t instanceof d && t.unsubscribe(e);
  }
};
d.getValueContextStack = [];
let m = d;
class h extends m {
  constructor(t, e) {
    super(h.actualGetter(t), e);
  }
  setValue(t) {
    super.setValue(h.actualGetter(t));
  }
  static value(t) {
    return t instanceof m ? t.getValue() : t instanceof Function ? t() : t;
  }
  static actualGetter(t) {
    return t instanceof m ? () => t.getValue() : t instanceof Function ? t : () => t;
  }
  static from(t) {
    if (t instanceof h) return t;
    if (t instanceof m) throw new Error("Only NFSignals allowed here");
    return new h(t);
  }
}
function $(i, t) {
  const e = new h(!1);
  return new IntersectionObserver(
    (r) => {
      let u = r[0];
      for (let n = 1; n < r.length; ++n)
        r[n].time > u.time && (u = r[n]);
      e.setValue(u.isIntersecting);
    },
    { root: t }
  ).observe(i), e;
}
class C extends HTMLElement {
  constructor() {
    super(), this.elements = new h([]), this.drawRequested = !1, this.hoveredElement = null, this.currentDrag = null, this._updateSize = () => this.updateSize(), this.debouncedDraw = () => {
      this.drawRequested || this.disabled.getValue() || (this.drawRequested = !0, setTimeout(() => this.draw(), 0));
    }, this.releaseDrag = () => {
      this.currentDrag && (this.currentDrag.element.active.setValue(!1), this.currentDrag = null, this.style.cursor = "grab", this.debouncedDraw());
    }, this.dimensions = new h(() => ({
      width: this.attrOr("width", this.clientWidth),
      height: this.attrOr("height", this.clientHeight)
    })), this.background = new h(this.getAttribute("background") ?? "white");
    const t = this.isOnScreen();
    this.disabled = new h(() => !t.getValue()), this.elements.subscribe(this.debouncedDraw), setTimeout(() => this.draw());
  }
  updateSize() {
    this.dimensions.markDirty();
  }
  connectedCallback() {
    window.addEventListener("resize", this._updateSize);
  }
  disconnectedCallback() {
    window.removeEventListener("resize", this._updateSize);
  }
  isOnScreen(t) {
    return $(this, t);
  }
  mouseCoords(t) {
    return { x: t.offsetX, y: t.offsetY };
  }
  touchCoords(t) {
    const e = this.getBoundingClientRect();
    return { x: t.clientX - e.left, y: t.clientY - e.top };
  }
  attrOr(t, e) {
    return this.hasAttribute(t) ? parseFloat(this.getAttribute(t)) : e;
  }
  add(t) {
    const e = this.elements.getValue();
    return e.includes(t) || (this.elements.setValue([...e, t]), t.subscribe(this.debouncedDraw)), t;
  }
  // this is called "delete" because HTML elements come with a function called "remove" that does something else
  delete(t) {
    const e = this.elements.getValue();
    return this.elements.setValue(e.filter((s) => s != t)), t.unsubscribe(this.debouncedDraw), t;
  }
  draw() {
    this.drawRequested = !1, this.drawFrame();
  }
  startDrag(t, e, s) {
    const r = e ? this.mouseCoords(e) : s ? this.touchCoords(s) : t.dragPos();
    this.currentDrag = {
      element: t,
      start: r,
      current: r,
      touchId: s == null ? void 0 : s.identifier
    }, t.active.setValue(!0), this.style.cursor = "grabbing", this.debouncedDraw();
  }
}
const A = "http://www.w3.org/2000/svg";
class c {
  constructor(t, e) {
    this.params = c.paramsSignalFrom(t), this.options = c.paramsSignalFrom(e);
  }
  getParams() {
    return this.params.getValue();
  }
  getOptions() {
    return this.options.getValue();
  }
  setParams(t) {
    return this.params.setValue(t), this;
  }
  setOptions(t) {
    return this.options.setValue(t), this;
  }
  createTag(t, e) {
    this.svgNode = document.createElementNS(A, t), e && e.appendChild(this.svgNode);
    const { zIndex: s } = this.getOptions();
    p(this.svgNode, {
      "z-index": (s == null ? void 0 : s.toString()) ?? "0"
    });
  }
  drawSvg(t, e) {
    this.svgNode || this.createTag(this.tagName, e), this.updateSvg(t);
  }
  setSvgTag(t) {
    if (this.svgNode.tagName != t) {
      const e = this.svgNode.parentNode;
      e.removeChild(this.svgNode), this.createTag(t, e);
    }
  }
  static value(t) {
    return t instanceof c ? t.getParams() : h.value(t);
  }
  static paramsSignalFrom(t) {
    return t instanceof c ? t.params : h.from(t);
  }
  subscribeParams(t) {
    this.params.subscribe(t);
  }
  unsubscribeParams(t) {
    this.params.unsubscribe(t);
  }
  subscribeOptions(t) {
    this.options.subscribe(t);
  }
  unsubscribeOptions(t) {
    this.options.unsubscribe(t);
  }
  subscribe(t) {
    this.params.subscribe(t), this.options.subscribe(t);
  }
  unsubscribe(t) {
    this.params.unsubscribe(t), this.options.unsubscribe(t);
  }
}
function l(i, t, e) {
  i.setAttribute(t, e);
}
function p(i, t) {
  i.setAttribute("style", Object.entries(t).map(([e, s]) => `${e}: ${s}`).join("; "));
}
class y extends c {
  constructor() {
    super(...arguments), this.active = new h(!1), this.hover = new h(!1), this.canBeDragged = !1;
  }
}
class F extends C {
  constructor() {
    super(), this.canvas = document.createElement("canvas"), this.focusElement = null, this.updateHover = (t) => {
      const e = this.mouseCoords(t);
      if (this.currentDrag) {
        this.currentDrag.element.dragTo(
          e,
          this.currentDrag.start
        ), this.currentDrag.current = e;
        return;
      }
      let s = 0, r = null;
      for (const u of this.elements.getValue()) {
        if (!(u instanceof y) || u.getOptions().disabled) continue;
        const n = u.hoverScore(e);
        n > s && (s = n, r = u);
      }
      if (!r) {
        this.cancelHover();
        return;
      }
      this.hoveredElement != r && (r.hover.setValue(!0), this.hoveredElement = r, this.debouncedDraw(), this.style.cursor = r.canBeDragged ? "grab" : "pointer");
    }, this.cancelHover = () => {
      this.releaseDrag(), this.hoveredElement && (this.hoveredElement.hover.setValue(!1), this.hoveredElement = null, this.debouncedDraw(), this.style.cursor = "auto");
    }, this.appendChild(this.canvas), this.pixelDensity = new h(() => this.attrOr("pixel-density", devicePixelRatio)), this.scaledDimensions = new h(() => {
      const t = this.pixelDensity.getValue(), e = this.dimensions.getValue();
      return {
        width: e.width * t,
        height: e.height * t
      };
    }), this.scaledDimensions.subscribe(() => {
      const { width: t, height: e } = this.scaledDimensions.getValue();
      this.canvas.width = t, this.canvas.height = e, this.ctx = this.canvas.getContext("2d");
      const s = this.pixelDensity.getValue();
      this.ctx.scale(s, s), this.debouncedDraw();
    }, { runNow: !0 }), this.canvas.addEventListener("mouseenter", this.updateHover), this.canvas.addEventListener("mousemove", this.updateHover), this.canvas.addEventListener("mousedown", (t) => {
      this.hoveredElement && this.startDrag(this.hoveredElement, t);
    }), this.canvas.addEventListener("mouseup", this.releaseDrag), this.canvas.addEventListener("mouseleave", this.cancelHover), this.elements.subscribe(() => {
      const t = this.elements.getValue().filter((e) => e instanceof y);
      if (t.length == 0) {
        this.tabIndex = -1;
        return;
      }
      this.tabIndex = 0, this.focusElement = t[0], this.debouncedDraw();
    }), this.addEventListener("keydown", (t) => {
      var s, r, u, n, a;
      const e = this.elements.getValue().filter((o) => o instanceof y);
      switch (t.key) {
        case "ArrowUp":
          this.currentDrag && (this.currentDrag.current = {
            x: this.currentDrag.current.x,
            y: this.currentDrag.current.y - 10
          }, this.currentDrag.element.dragTo(this.currentDrag.current, this.currentDrag.start));
          break;
        case "ArrowDown":
          this.currentDrag && (this.currentDrag.current = {
            x: this.currentDrag.current.x,
            y: this.currentDrag.current.y + 10
          }, this.currentDrag.element.dragTo(this.currentDrag.current, this.currentDrag.start));
          break;
        case "ArrowLeft":
          if (this.currentDrag)
            this.currentDrag.current = {
              x: this.currentDrag.current.x - 10,
              y: this.currentDrag.current.y
            }, this.currentDrag.element.dragTo(this.currentDrag.current, this.currentDrag.start);
          else {
            const o = e.indexOf(this.focusElement);
            (s = this.focusElement) == null || s.hover.setValue(!1), this.focusElement = e[(o + e.length - 1) % e.length], (r = this.focusElement) == null || r.hover.setValue(!0);
          }
          break;
        case "ArrowRight":
          if (this.currentDrag)
            this.currentDrag.current = {
              x: this.currentDrag.current.x + 10,
              y: this.currentDrag.current.y
            }, this.currentDrag.element.dragTo(this.currentDrag.current, this.currentDrag.start);
          else {
            const o = e.indexOf(this.focusElement);
            (u = this.focusElement) == null || u.hover.setValue(!1), this.focusElement = e[(o + 1) % e.length], (n = this.focusElement) == null || n.hover.setValue(!0);
          }
          break;
        case " ":
          this.currentDrag ? this.releaseDrag() : (a = this.focusElement) != null && a.canBeDragged && this.startDrag(this.focusElement);
          break;
        default:
          console.log(t.key);
          return;
      }
      this.debouncedDraw(), t.preventDefault();
    }), this.addEventListener("focus", () => {
      var t;
      this.debouncedDraw(), (t = this.focusElement) == null || t.hover.setValue(!0);
    }), this.addEventListener("blur", () => {
      var t;
      this.debouncedDraw(), (t = this.focusElement) == null || t.hover.setValue(!1);
    });
  }
  updateSize() {
    super.updateSize(), this.pixelDensity.markDirty();
  }
  drawFrame() {
    this.ctx.fillStyle = this.background.getValue();
    const t = this.scaledDimensions.getValue();
    this.ctx.fillRect(0, 0, t.width, t.height);
    const e = [...this.elements.getValue()].filter((s) => !s.getOptions().disabled).sort((s, r) => (s.getOptions().zIndex ?? 0) - (r.getOptions().zIndex ?? 0));
    for (const s of e)
      s.draw(this);
  }
}
window.customElements.define("signal-canvas", F);
class z extends C {
  constructor() {
    super(), this.svg = document.createElementNS(A, "svg"), this.bg = document.createElementNS(A, "rect"), this.appendChild(this.svg), this.svg.appendChild(this.bg), l(this.bg, "x", "0"), l(this.bg, "t", "0"), this.dimensions.subscribe(() => {
      const e = this.dimensions.getValue();
      l(this.svg, "viewBox", `0 0 ${e.width} ${e.height}`), l(this.svg, "width", `${e.width}`), l(this.svg, "height", `${e.height}`), l(this.bg, "width", `${e.width}`), l(this.bg, "height", `${e.height}`);
    }, { runNow: !0 }), this.background.subscribe(
      () => p(this.bg, { fill: this.background.getValue() }),
      { runNow: !0 }
    ), this.addEventListener("mouseover", (e) => {
      const s = this.getTarget(e.target);
      s && (this.hoveredElement = s, s.hover.setValue(!0), this.debouncedDraw());
    }), this.addEventListener("mouseout", (e) => {
      const s = this.getTarget(e.target);
      s && (this.hoveredElement == s && (this.hoveredElement = null), s.hover.setValue(!1), this.debouncedDraw());
    }), this.addEventListener("mouseleave", this.releaseDrag), this.addEventListener("mouseup", this.releaseDrag), this.addEventListener("mousedown", (e) => {
      const s = this.getTarget(e.target);
      s && s.canBeDragged && this.startDrag(s, e);
    }), this.addEventListener("touchstart", (e) => {
      if (!this.currentDrag)
        for (const s of e.changedTouches) {
          const r = this.getTarget(s.target);
          if (r && r.canBeDragged) {
            this.startDrag(r, null, s), e.preventDefault();
            return;
          }
        }
    });
    function t(e) {
      if (this.currentDrag) {
        for (const s of e.changedTouches)
          if (s.identifier == this.currentDrag.touchId) {
            this.releaseDrag(), e.preventDefault();
            return;
          }
      }
    }
    this.addEventListener("touchend", t), this.addEventListener("touchcancel", t), this.addEventListener("touchmove", (e) => {
      if (this.currentDrag) {
        for (const s of e.changedTouches)
          if (s.identifier == this.currentDrag.touchId) {
            this.currentDrag.element.dragTo(this.touchCoords(s), this.currentDrag.start), e.preventDefault();
            return;
          }
      }
    }), this.addEventListener("mousemove", (e) => {
      if (!this.currentDrag) {
        this.style.cursor = "unset";
        return;
      }
      this.currentDrag.current = this.mouseCoords(e), this.currentDrag.element.dragTo(this.currentDrag.current, this.currentDrag.start);
    }), this.addEventListener("keydown", (e) => {
      if (this.currentDrag) {
        switch (e.key) {
          case " ":
            this.releaseDrag();
            break;
          case "ArrowUp":
            this.currentDrag.current = { x: this.currentDrag.current.x, y: this.currentDrag.current.y - 10 }, this.currentDrag.element.dragTo(this.currentDrag.current, this.currentDrag.start);
            break;
          case "ArrowDown":
            this.currentDrag.current = { x: this.currentDrag.current.x, y: this.currentDrag.current.y + 10 }, this.currentDrag.element.dragTo(this.currentDrag.current, this.currentDrag.start);
            break;
          case "ArrowLeft":
            this.currentDrag.current = { x: this.currentDrag.current.x - 10, y: this.currentDrag.current.y }, this.currentDrag.element.dragTo(this.currentDrag.current, this.currentDrag.start);
            break;
          case "ArrowRight":
            this.currentDrag.current = { x: this.currentDrag.current.x + 10, y: this.currentDrag.current.y }, this.currentDrag.element.dragTo(this.currentDrag.current, this.currentDrag.start);
            break;
          default:
            return;
        }
        e.preventDefault(), this.debouncedDraw();
        return;
      }
      const s = this.getTarget(e.target);
      s && e.key == " " && s.canBeDragged && (this.startDrag(s), e.preventDefault());
    });
  }
  drawFrame() {
    const t = [...this.elements.getValue()].filter((e) => !e.getOptions().disabled).sort((e, s) => (e.getOptions().zIndex ?? 0) - (s.getOptions().zIndex ?? 0));
    for (const e of t)
      e.drawSvg(this, this.svg);
  }
  getTarget(t) {
    for (; t.parentNode != this.svg; ) {
      if (t == this) return null;
      t = t.parentNode;
    }
    for (const e of this.elements.getValue())
      if (e instanceof y && e.svgNode == t)
        return e;
    return null;
  }
}
window.customElements.define("signal-svg", z);
class L extends HTMLElement {
  constructor(t, e) {
    super(), this.value = new h(t), this.options = e, this.hasAttribute("label") && (this.options.label = this.getAttribute("label")), this.label = document.createElement("label"), this.labelSpan = document.createElement("span"), this.labelSpan.innerText = this.options.label, this.label.appendChild(this.labelSpan), this.input = document.createElement("input"), this.input.value = this.valueToString(t), this.label.appendChild(this.input), this.appendChild(this.label);
  }
  getValue() {
    return this.value.getValue();
  }
}
class R extends L {
  constructor(t) {
    super(!1, t), this.input.addEventListener("input", () => this.value.setValue(this.input.checked)), this.value.subscribe(() => this.input.checked = this.value.getValue()), this.hasAttribute("checked") && this.value.setValue(!!this.getAttribute("checked"));
  }
  getValue() {
    return this.value.getValue();
  }
}
class B extends L {
  constructor(t, e) {
    super(t, e), this.input.addEventListener("input", () => this.value.setValue(this.parseValue(this.input.value))), this.value.subscribe(() => this.input.value = this.valueToString(this.value.getValue())), this.hasAttribute("value") && this.value.setValue(this.parseValue(this.getAttribute("value")));
  }
  getValue() {
    return this.value.getValue();
  }
}
class H extends B {
  constructor() {
    var t;
    super(0, { min: 0, max: 1, step: null, label: "Number" }), this.hasAttribute("min") && (this.options.min = parseFloat(this.getAttribute("min"))), this.hasAttribute("max") && (this.options.max = parseFloat(this.getAttribute("max"))), this.hasAttribute("step") && (this.getAttribute("step") == "any" ? this.options.step = null : this.options.step = parseFloat(this.getAttribute("step"))), this.input.setAttribute("type", "range"), this.input.setAttribute("min", this.options.min.toString()), this.input.setAttribute("max", this.options.max.toString()), this.input.setAttribute("step", ((t = this.options.step) == null ? void 0 : t.toString()) ?? "any");
  }
  parseValue(t) {
    return parseFloat(t);
  }
  valueToString(t) {
    return t.toString();
  }
}
window.customElements.define("signal-slider", H);
class q extends R {
  constructor() {
    super({ label: "Toggle" }), this.input.setAttribute("type", "checkbox");
  }
  parseValue(t) {
    return !!t;
  }
  valueToString(t) {
    return t ? "checked" : "";
  }
}
window.customElements.define("signal-checkbox", q);
function Z() {
  const i = new h(0);
  let t;
  function e(s) {
    t || (t = s);
    const r = s - t;
    i.setValue(r), requestAnimationFrame(e);
  }
  return requestAnimationFrame(e), i;
}
function G(i, t) {
  if (!(i != null && i.a) || !(t != null && t.a) || !i.b || !t.b) return null;
  const e = i.a.x - i.b.x, s = t.a.x - t.b.x, r = i.a.y - i.b.y, u = t.a.y - t.b.y, n = e * u - s * r;
  if (!n) return null;
  const a = i.a.x * i.b.y - i.b.x * i.a.y, o = t.a.x * t.b.y - t.b.x * t.a.y;
  return {
    x: (a * s - o * e) / n,
    y: (a * u - o * r) / n
  };
}
class E extends c {
  constructor(t, e) {
    var s = (...r) => (super(...r), this.tagName = "circle", this);
    e === void 0 ? s(
      t,
      {}
    ) : s(
      () => ({
        x: h.value(t),
        y: h.value(e)
      }),
      {}
    );
  }
  draw({ ctx: t }) {
    const e = this.getParams();
    if (!e) return;
    const s = this.getOptions();
    t.fillStyle = s.colour ?? "black", t.beginPath(), t.arc(e.x, e.y, s.radius ?? 4, 0, Math.PI * 2, !0), t.fill();
  }
  updateSvg() {
    const t = this.getParams(), { radius: e, disabled: s, colour: r, zIndex: u } = this.getOptions();
    l(this.svgNode, "cx", ((t == null ? void 0 : t.x) ?? 0).toString()), l(this.svgNode, "cy", ((t == null ? void 0 : t.y) ?? 0).toString()), l(this.svgNode, "r", (t && !s ? e ?? 4 : -1).toString()), p(this.svgNode, {
      fill: r ?? "black",
      "z-index": (u == null ? void 0 : u.toString()) ?? "0"
    });
  }
  add(t) {
    return new E(() => {
      const e = this.getParams(), s = c.value(t);
      return !s || !e ? null : { x: e.x + s.x, y: e.y + s.y };
    }).setOptions(() => this.getOptions());
  }
  distanceTo(t) {
    return new h(() => {
      const e = this.getParams(), s = c.value(t);
      return !s || !e ? null : Math.sqrt((e.x - s.x) ** 2 + (e.y - s.y) ** 2);
    });
  }
  static lineIntersection(t, e) {
    return new E(() => G(
      c.value(t),
      c.value(e)
    ));
  }
}
function O(i, t = 1, e = { x: 0, y: 0 }) {
  return {
    x: Math.cos(i) * t + e.x,
    y: Math.sin(i) * t + e.y
  };
}
class w extends c {
  constructor(t, e) {
    var s = (...r) => (super(...r), this.tagName = "path", this);
    e ? s(
      () => ({
        a: c.value(t),
        b: c.value(e)
      }),
      {}
    ) : s(
      t,
      {}
    );
  }
  static applyLineOptions(t, e = {}) {
    t.strokeStyle = e.colour ?? "black", t.lineWidth = e.width ?? 1, t.setLineDash(e.dashes ?? []);
  }
  trueEnds(t) {
    const e = this.getParams(), s = this.getOptions();
    if (!(e != null && e.a) || !(e != null && e.b) || e.a.x == e.b.x && e.a.y == e.b.y) return null;
    let r = e.a, u = e.b;
    if (s.extendPastA || s.extendPastB) {
      const n = X(r, u), a = t.width + t.height;
      if (s.extendPastA) {
        const o = T(t, n, r);
        if (o > -a) {
          const g = o + a;
          r = { x: r.x - n.x * g, y: r.y - n.y * g };
        }
      }
      if (s.extendPastB) {
        const o = T(t, n, u);
        if (o < a) {
          const g = a - o;
          u = { x: u.x + n.x * g, y: u.y + n.y * g };
        }
      }
    }
    return { start: r, end: u };
  }
  draw({ ctx: t, dimensions: e }) {
    const s = e.getValue(), r = this.trueEnds(s);
    if (!r) return;
    const u = this.getOptions();
    w.applyLineOptions(t, u), t.beginPath(), t.moveTo(r.start.x, r.start.y), t.lineTo(r.end.x, r.end.y), t.stroke();
  }
  updateSvg({ dimensions: t }) {
    const e = t.getValue(), s = this.trueEnds(e);
    s && (l(
      this.svgNode,
      "d",
      `M ${s.start.x} ${s.start.y}
             L ${s.end.x} ${s.end.y}`
    ), p(this.svgNode, w.svgStyles(this.getOptions())));
  }
  static svgStyles({ width: t, colour: e, dashes: s }) {
    return {
      stroke: e ?? "black",
      "stroke-width": `${t ?? 1}px`,
      "stroke-dasharray": (s == null ? void 0 : s.map((r) => `${r}px`).join(" ")) ?? ""
    };
  }
}
function T({ width: i, height: t }, e, s) {
  const r = { x: s.x - i / 2, y: s.y - t / 2 };
  return r.x * e.x + r.y * e.y;
}
function X(i, t) {
  const e = Math.sqrt(i.x * i.x + t.x * t.x);
  return { x: (t.x - i.x) / e, y: (t.y - i.y) / e };
}
class Y extends c {
  constructor(t, e) {
    var s = (...r) => (super(...r), this.tagName = "circle", this);
    e !== void 0 ? s(
      () => ({
        centre: c.value(t),
        radius: h.value(e)
      }),
      {}
    ) : s(
      t,
      {}
    );
  }
  getCentre() {
    return new h(this.getParams().centre);
  }
  // TODO: support making a circle from three points
  draw({ ctx: t }) {
    const e = this.getParams(), s = this.getOptions();
    !e.centre || !e.radius || (w.applyLineOptions(t, s), t.beginPath(), t.arc(
      e.centre.x,
      e.centre.y,
      e.radius,
      e.startAngle ?? 0,
      e.endAngle ?? Math.PI * 2,
      !!e.counterClockwise
    ), t.stroke());
  }
  updateSvg() {
    const {
      centre: t,
      radius: e,
      startAngle: s,
      endAngle: r,
      counterClockwise: u = !1
    } = this.getParams(), { disabled: n, ...a } = this.getOptions();
    if (n || !e || !t) {
      l(this.svgNode, "d", "M 0 0");
      return;
    }
    if (typeof s == "number" && typeof r == "number") {
      this.setSvgTag("path");
      let o = O(s, e, t), g = O(r, e, t);
      u && ([o, g] = [g, o]);
      const x = (r - s + Math.PI * 4) % (Math.PI * 2) >= Math.PI;
      l(
        this.svgNode,
        "d",
        `M ${o.x} ${o.y}
                A ${e} ${e} 0
                ${+x} 1
                ${g.x} ${g.y}`
      );
    } else
      this.setSvgTag("circle"), l(this.svgNode, "cx", t.x.toString()), l(this.svgNode, "cy", t.y.toString()), l(this.svgNode, "r", e.toString());
    p(this.svgNode, {
      ...w.svgStyles(a),
      fill: "none"
    });
  }
}
const D = class D extends c {
  constructor(t, e) {
    var s = (...r) => (super(...r), this.tagName = "text", this);
    e ? s(
      () => ({
        location: c.value(e),
        text: h.value(t)
      }),
      {}
    ) : s(
      t,
      {}
    );
  }
  draw({ ctx: t }) {
    const { location: e, text: s } = this.getParams(), r = this.getOptions();
    !e || !s || (t.font = r.font ?? D.defaultFont, t.fillStyle = r.colour ?? "black", t.textAlign = r.align ?? "start", t.fillText(s, e.x, e.y));
  }
  updateSvg() {
    const { location: t, text: e } = this.getParams(), { disabled: s, colour: r, align: u, font: n } = this.getOptions();
    if (s || !t || !e) {
      this.svgNode.replaceChildren();
      return;
    }
    this.svgNode.replaceChildren(document.createTextNode(e)), l(this.svgNode, "x", t.x.toString()), l(this.svgNode, "y", t.y.toString()), p(this.svgNode, {
      "text-anchor": W[u ?? "left"],
      fill: r ?? "black",
      font: n ?? D.defaultFont
    });
  }
};
D.defaultFont = "16px sans-serif";
let P = D;
var I = /* @__PURE__ */ ((i) => (i.LeftAlign = "left", i.RightAlign = "right", i.CentreAlign = "center", i.StartAlign = "start", i.EndAlign = "end", i))(I || {});
const W = {
  left: "start",
  center: "middle",
  right: "end",
  start: "start",
  end: "end"
};
class M extends c {
  constructor(t, e, s) {
    super(t, e), this.tagName = "g", this.elements = c.paramsSignalFrom(s);
  }
  members() {
    return this.elements.getValue().filter((t) => {
      var e;
      return !((e = t.getOptions()) != null && e.disabled);
    }).sort((t, e) => {
      var s, r;
      return (((s = t.getOptions()) == null ? void 0 : s.zIndex) ?? 0) - (((r = e.getOptions()) == null ? void 0 : r.zIndex) ?? 0);
    });
  }
  draw(t) {
    for (const e of this.members())
      e.draw(t);
  }
  updateSvg(t) {
    for (const e of this.members())
      e.drawSvg(t, this.svgNode);
  }
}
class U extends M {
  constructor(t) {
    super(null, {}, t);
  }
}
class j extends M {
  constructor(t, e, s, r) {
    e ? super(() => ({
      from: c.value(t),
      hinge: c.value(e),
      to: c.value(s),
      value: c.value(r)
    }), {}, []) : super(t, {}, []);
    const u = new m(() => {
      const { from: n, hinge: a, to: o } = this.getParams();
      if (!n || !a || !o) return null;
      const g = { x: n.x - a.x, y: n.y - a.y }, v = { x: o.x - a.x, y: o.y - a.y }, x = Math.atan2(g.y, g.x), f = Math.atan2(v.y, v.x);
      return { from: n, hinge: a, to: o, htf: g, htt: v, fromAngle: x, toAngle: f };
    });
    this.circle = new Y(() => {
      const n = u.getValue();
      if (!n) return { centre: null, radius: null };
      const { radius: a } = this.getOptions();
      return {
        centre: n.hinge,
        radius: a ?? 32,
        startAngle: n.fromAngle,
        endAngle: n.toAngle
      };
    }).setOptions(() => this.getOptions().line ?? {}), this.label = new P(() => {
      const { value: n, hinge: a } = this.getParams(), { name: o, unit: g, decimalPlaces: v, labelDistance: x, labelOffset: f } = this.getOptions(), S = u.getValue();
      if (!S) return { text: "", location: a };
      let V = S.toAngle - S.fromAngle;
      V < 0 && (V += Math.PI * 2);
      const k = S.fromAngle + V * 0.5;
      let b = "";
      n ? b = n : !b && g != "hidden" && (b = (V / K(g)).toFixed(v) + Q(g));
      const N = x ?? 48;
      return {
        text: o ? b ? `${o} = ${b}` : o : b,
        location: {
          x: a.x + Math.cos(k) * N + ((f == null ? void 0 : f.x) ?? 0),
          y: a.y + Math.sin(k) * N + ((f == null ? void 0 : f.y) ?? 8)
        }
      };
    }).setOptions(() => {
      const n = this.getParams(), a = this.getOptions();
      return {
        disabled: !a.showValue && !n.value && !a.name,
        align: I.CentreAlign,
        ...a.label
      };
    }), this.elements.setValue([this.circle, this.label]);
  }
}
var J = /* @__PURE__ */ ((i) => (i.Hidden = "hidden", i.Radians = "radians", i.RadiansInTermsOfπ = "pi-radians", i.Revolutions = "revolutions", i.Degrees = "degrees", i))(J || {});
function K(i) {
  switch (i) {
    case void 0:
    case "radians":
      return 1;
    case "pi-radians":
      return Math.PI;
    case "revolutions":
      return Math.PI * 2;
    case "degrees":
      return Math.PI / 180;
  }
}
function Q(i) {
  switch (i) {
    case void 0:
    case "radians":
      return "";
    case "pi-radians":
      return "π";
    case "revolutions":
      return " turns";
    case "degrees":
      return "°";
  }
}
class _ extends y {
  constructor(t, e) {
    const s = new h(t), r = c.paramsSignalFrom(e);
    super(() => ({
      params: s.getValue(),
      locus: r.getValue()
    }), {}), this.tagName = "g", this.t = s, this.locus = r, this.point = new E(() => {
      const { params: u, locus: n } = this.getParams();
      return n.fromParametricSpace(u);
    }).setOptions(() => {
      const { point: u, activePoint: n, hoverPoint: a } = this.getOptions();
      return this.active.getValue() ? n ?? a ?? { colour: "#08f", radius: 10 } : this.hover.getValue() ? a ?? { colour: "red", radius: 8 } : u ?? { colour: "#00f", radius: 6 };
    }), this.canBeDragged = !0;
  }
  draw(t) {
    this.point.draw(t);
  }
  updateSvg(t) {
    this.point.drawSvg(t, this.svgNode), l(this.svgNode, "tabindex", "0"), p(this.svgNode, { cursor: this.active.getValue() ? "grabbing" : "grab" });
  }
  hoverScore(t) {
    const e = this.point.getParams();
    if (!e) return 0;
    const s = e.x - t.x, r = e.y - t.y;
    return 1 - Math.sqrt(s * s + r * r) / 16;
  }
  dragTo(t) {
    const e = this.locus.getValue();
    this.t.setValue(() => e.toParametricSpace(t));
  }
  dragPos() {
    return this.locus.getValue().fromParametricSpace(this.t.getValue());
  }
}
const tt = {
  toParametricSpace(i) {
    return i;
  },
  fromParametricSpace(i) {
    return i;
  }
};
function et(i, t) {
  const e = Math.min(i.x, t.x), s = Math.max(i.x, t.x), r = Math.min(i.y, t.y), u = Math.max(i.y, t.y);
  return {
    toParametricSpace(n) {
      const a = { ...n };
      return a.x < e && (a.x = e), a.x > s && (a.x = s), a.y < r && (a.y = r), a.y > u && (a.y = u), {
        x: (a.x - e) / (s - e),
        y: (a.y - r) / (u - r)
      };
    },
    fromParametricSpace(n) {
      return {
        x: e + n.x * (s - e),
        y: r + n.y * (u - r)
      };
    }
  };
}
function st(i) {
  return {
    toParametricSpace() {
      return null;
    },
    fromParametricSpace() {
      return i;
    }
  };
}
function rt(i, t, e = {}) {
  const s = { x: t.x - i.x, y: t.y - i.y }, r = s.x * s.x + s.y * s.y, u = { x: s.x / r, y: s.y / r };
  return {
    toParametricSpace(n) {
      let a = (n.x - i.x) * u.x + (n.y - i.y) * u.y;
      return !e.extendPastA && a < 0 && (a = 0), !e.extendPastB && a > 1 && (a = 1), a;
    },
    fromParametricSpace(n) {
      return {
        x: i.x + s.x * n,
        y: i.y + s.y * n
      };
    }
  };
}
export {
  j as Angle,
  J as AngleUnit,
  tt as Anywhere,
  Y as Circle,
  _ as DraggablePoint,
  c as Element,
  U as Group,
  M as GroupBase,
  et as InARectangle,
  y as InteractiveElement,
  P as Label,
  w as Line,
  h as NFSignal,
  rt as OnALine,
  E as Point,
  q as SignalCheckbox,
  H as SignalSlider,
  m as Singal,
  st as Stationary,
  I as TextAlign,
  Z as everyFrame,
  $ as isOnScreen,
  G as lineIntersection
};
