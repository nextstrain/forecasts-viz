/**
 * Originally sourced from https://observablehq.com/@clhenrick/tooltip-component
 * and then used in a few of my own projects subsequent to this (with changes)
 */
export class Tooltip {
  constructor(parentElement) {
    if (!parentElement || !parentElement.size()) {
      throw new Error("Requires a parent element in which to create the tooltip");
    }
    this._selection = parentElement
      .append("div")
      .classed("tooltip", true);
  }

  move(event) {
    if (!event) return;
    const margin = 0;
    const { clientX: x, clientY: y } = event;
    const { width, height } = this.selection.node().getBoundingClientRect();                                                                        
    const left = this.clamp(
      margin,
      x - width / 2,
      window.innerWidth - width - margin
    );
    const top =
      window.innerHeight > y + margin + height
        ? y + margin
        : y - height - margin;
    this.selection.style("top", `${top}px`).style("left", `${left}px`);
  }

  display(callback, ...args) {
    if (!callback || typeof callback !== "function") {
      throw new Error("ToolTip.display requires a callback function that returns an HTML string");
    }
    this.selection.style("display", "block").html(callback.apply(this, args));
  }

  hide() {
    this.selection.style("display", "none").html("");
  }

  clamp(min, d, max) {
    return Math.max(min, Math.min(max, d));
  }

  get selection() {
    return this._selection;
  }

  set selection(sel) {
    if (sel && sel.size()) {
      this._selection = sel;
    } else {
      throw new Error("selection must be a non-empty selected element");
    }
  }
}

