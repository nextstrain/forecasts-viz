import {pointer} from 'd3';

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

  /**
   * Create a rectangle to represent the valid range of x & y scales.
   * In 'debug' mode this is coloured orange and a red dot is added to
   * the screen, when the xy() method is called then the dot position
   * will update. As this goes through xScale(xScale.invert(xPos))
   * it allows us to check the accuracy of the mouse handling.
   */
  createMouseCaptureArea(svg, xScale, yScale, debug=false) {
    this._xScale = xScale;
    this._yScale = yScale;
    this._mouseCaptureArea = svg
      .append("rect")
      .attr('x', xScale.range()[0])
      .attr('width', xScale.range()[1]-xScale.range()[0])
      .attr('y', yScale.range()[1])
      .attr('height', yScale.range()[0]-yScale.range()[1])
      .attr('fill', 'white')
      .attr('opacity', 0)
      .attr('stroke', 'none')
    if (debug) {
      this._debugDot = svg.append("circle")
        .attr("cx", "100")
        .attr("cy", "100")
        .attr("r", 5)
        .style("fill", "red")
        .style("pointer-events", "none")
      this._mouseCaptureArea
        .attr('fill', 'orange')
        .attr("opacity", 0.2);
    }
    return this._mouseCaptureArea;
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

  /** Intended for situations where the underlying values must be inferred */
  update(event, displayCallback, ...extraDisplayArgs) {
    this.move(event);
    this.display(displayCallback, this.xy(event), ...extraDisplayArgs)
  }

  /**
   * Return the x, y values which underlie the mouse cursor, i.e. the values (x, y)
   * such that (xScale(x), yScale(y)) is at the cursor position
   */
  xy(event) {
    /* xPos, yPos are relative to the `svg`, e.g. if we have 35px of left pad (for the axis labels etc)
    then the smallest xPos we can get will be 35, and this corresponds to the x.range of 0px
    Note the target for d3.pointer is the rectangle of mouseBg (via event.currentTarget):
    d3.pointer(event) = d3.pointer(event, event.currentTarget) = d3.pointer(event, mouseBg._groups[0][0]).
    These offsets are reflected in the scale ranges, i.e. x.range()[0] = 35.
    */
    const [xPos, yPos] = pointer(event);
    const xy = [this._xScale.invert(xPos), this._yScale.invert(yPos)]
    if (this._debugDot) {
      console.log(`pointer(${xPos}, ${yPos})`);
      console.log(`Value: ${xy[0]}, ${xy[1]}`);
      this._debugDot.attr('cx', this._xScale(xy[0])).attr('cy', this._yScale(xy[1]))
    }
    return xy;
  }

  hide() {
    this.selection.style("display", "none").html("");
  }

  clamp(min, d, max) {
    return Math.max(min, Math.min(max, d));
  }

  get mouseCaptureArea() {
    return this._mouseCaptureArea;
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

