import * as d3 from "d3";
import { logitScale } from "./logitScale";
import { Tooltip } from "./tooltip";
import { cssSafeName } from "./cssSafeName";

const TRANSITION_DURATION = 700;

export function D3Graph(d3Container, sizes, modelData, params, options) {
  const dom = d3.select(d3Container.current);
  this.svg = svgSetup(dom, sizes);
  this.tooltip = new Tooltip(dom);
  this.modelData = modelData;
  this.params = params;
  this.sizes = sizes;
  this.setStyles();

  this.createScales(options, params);
  this.drawAxes();

  this.setupTooltipXY();

  this.setupLine();
  this.setupArea();
  this.drawArea();
  this.drawLines();
  this.drawPoints();
  /* Note: raw data points never drawn on initial render */

  this.drawForecastLine();
  this.drawDashedLines();
  this.annotateFinalPoint();
  this.title();
}


D3Graph.prototype.createScales = function({logit}, {log2}) {
  const customXDomain = Array.isArray(this.params.xDomain) ?
    [...this.params.xDomain] :
      typeof this.params.xDomain === "function" ?
      this.params.xDomain.call(this) :
        undefined;
  const customYDomain = Array.isArray(this.params.yDomain) ?
    [...this.params.yDomain] :
      typeof this.params.yDomain === "function" ?
      this.params.yDomain.call(this) :
        undefined;
  if (!customYDomain) throw new Error("Params must define the 'yDomain'")

  switch (this.params.graphType) {
    case "lines": // fallthrough
    case "stream":
      this.x = d3.scalePoint()
        .domain(customXDomain || this.modelData.get('dates'))
      this.x.invert = invertScalePoint;
      this.y = (logit ? logitScale() : d3.scaleLinear())
        .domain(customYDomain)
      break
    case "points":
      this.x = d3.scalePoint()
        .domain(customXDomain || [...this.modelData.get('variants')])
      this.y = (log2 ? d3.scaleLog().base(2): d3.scaleLinear())
        .domain(customYDomain)
      break;
    default:
      throw new Error("TODO!");
    }
    this.x.range([this.sizes.left, this.sizes.width-this.sizes.right]);
    this.y.range([this.sizes.height-this.sizes.bottom, this.sizes.top]); // y=0 is @ top. Range is [bottom_y, top_y] which maps 0 to the bottom and 1 to the top (of the graph)
}

D3Graph.prototype.drawAxes = function() {
  /**
   * X-axis. Note the scale is always `scalePoint`, so we must control the ticks to
   * show manually (i.e. can't use `axis.ticks()`)
   */
  // First work out which ticks to display and how to display them
  // `xTicks` is a dict of tick value -> displayed text.
  const xTicks = {};
  if (this.params.graphType==="points") {
    // display every variant (point in the domain)
    this.x.domain().forEach((variant) => {
      xTicks[variant] = this.modelData.get('variantDisplayNames').get(variant) || variant;
    });
  } else {
    if (this.modelData.get('sparseDates')===false) {
      // We have values for every day (i.e. no holes), so display a tick for
      // the first day of each month
      this.x.domain().forEach((dStr) => {
        const date = d3.timeParse("%Y-%m-%d")(dStr);
        if (d3.timeFormat("%d")(date)==='01') {
          xTicks[dStr] = `${d3.timeFormat("%b")(date)}`;
        }
      });
    } else {
      // sparse data - plot the first tick for each month encountered
      let _lastTick;
      this.x.domain().forEach((dStr, i) => {
        const date = d3.timeParse("%Y-%m-%d")(dStr);
        const month = d3.timeFormat("%m")(date)
        if (month!==_lastTick) {
          // don't plot first tick (aesthetic reasons)
          if (_lastTick) {
            xTicks[dStr] = `${d3.timeFormat("%b %e")(date)}`;
          }
          _lastTick=month;
        }
      });
    }
  }
  this.svg.append("g")
    .call((g) => g
      .attr("transform", `translate(0,${this.sizes.height-this.sizes.bottom})`)
      .call(
        d3.axisBottom(this.x)
          .tickSize(2) /* small (vertical) tick lines */
          .tickValues(Object.keys(xTicks))
      )
      // .call(g => g.select(".domain").remove())
      .selectAll("text")
        .text((tickValue) => xTicks[tickValue])
        // .attr("y", 0)
        // .attr("x", (d) => x(d))
        .attr("dy", "0.6em")
        .attr("transform", "rotate(45)")
        .style("text-anchor", "start")
        .style("font-size", "12px")
        .style("fill", "#aaa")
    );

  /**
   * Y-axis
   */
  this.svg.append("g")
    .attr("class", "yAxis")
    .call(simpleYAxis(this.y, this.sizes, this.params.yTickFmt));
}

D3Graph.prototype.setupTooltipXY = function() {
  if (typeof this.params.tooltipXY === "function") {
    this.tooltip.createMouseCaptureArea(this.svg, this.x, this.y, false) // todo = update if x,y change?
      .on("mousemove", (event) => this.tooltip.update(event, this.params.tooltipXY, this.modelData, this.params))
      .on("mouseout", () => this.tooltip.hide())
  }
}

D3Graph.prototype.setupLine = function() {
  if (this.params.graphType==="points") return;
  this.line = d3.line()
    .defined(d => !isNaN(d.get(this.params.key)) && !!d.get(this.params.key))
    .curve(d3.curveLinear)
    .x((d) => this.x(d.get('date')))
    .y((d) => this.y(d.get(this.params.key)))
}

D3Graph.prototype.setupArea = function() {
  if (this.params.graphType==="points") return;
  if (!this.params.interval) return;
  this.area = d3.area()
    .defined(d => d.get(this.params.interval[0])!==undefined && d.get(this.params.interval[1])!==undefined && !!d.get('date'))
    .curve(d3.curveLinear)
    .x((d) => this.x(d.get('date')))
    .y0((d) => this.y(d.get(this.params.interval[0])))
    .y1((d) => this.y(d.get(this.params.interval[1])))
}

D3Graph.prototype.drawLines = function() {
  if (this.params.graphType!=="lines") return;
  this.modelData.get('points').get(this.params.location).forEach((variantPoint, variant) => {
    const temporalPoints = variantPoint.get('temporal');
    const color = this.getVariantColor(variant);
    const g = this.svg.append('g')
      .attr("class", cssSafeName(`variant_${variant}`));

    if (this.params.interval) {
      g.append('path')
        .attr("class", "area")
        .attr("stroke", "none")
        .attr("fill", color)
        .attr("opacity", this.styles.lines.area.opacity.normal)
        .attr("d", this.area(temporalPoints))
        .style('pointer-events', 'none')
    }

    g.append('path')
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", this.styles.lines.line.strokeWidth.normal)
      .attr("stroke-opacity", this.styles.lines.line.opacity.normal)
      .attr("d", this.line(temporalPoints))
      .style('pointer-events', 'none')
    /**
     * Tooltips for lines (or areas) can be accomplished by attaching the following to the groups:
     * .on("mousemove", (event) => tooltip.update(event, callback)
     * .on("mouseout", () => tooltip.hide())
     * See `displayFrequencySummary` for an example callback.
     * Note that the order matters -- the 'top' (last rendered) element will capture the event
     * (Don't forget to remove the pointer-events style of 'none'!)
     */
  });
}

/**
 * This approach is similar to the forEach approach used in `drawLines`, but
 * this is the more canonical data-join d3 approach.
 * It is here simply as an alternative way of doing things in d3, as one may
 * prove to be more versatile than the other going forward.
 * Note: this works "out of the box" for the HPDs in a lines graph, but the
 * `updateScale` function would need to be updated.
 */
D3Graph.prototype.drawArea = function() {
  if (this.params.graphType!=="stream") return;
  if (!Array.isArray(this.params.interval)) return;
  const variants = this.modelData.get('variants');
  const dataPerVariant = this.modelData.get('points').get(this.params.location)
  // const colour = (variant) => 
  //   this.modelData.get('variantColors').get(variant) || this.modelData.get('variantColors').get('other');
  this.svg.append('g')
    .attr("class", this.params.tooltipPt ? "area" : "noCapture area")
    .selectAll("stackedLayer")
    .data(variants)
    .enter()
    .append("path")
      .style("fill", (variant) => this.getVariantColor(variant))
      .style("fill-opacity", this.params.intervalOpacity ?? 0.5)
      .style("stroke", (variant) => this.getVariantColor(variant))
      .style("stroke-width", this.params.intervalStrokeWidth ?? 0)
      .attr("d", (variant) => this.area(dataPerVariant.get(variant).get('temporal')))
}


D3Graph.prototype.drawPoints = function() {
  if (this.params.graphType!=="points") return;
  if (!this.points) {
    // only computed once because a change in location or model data
    // runs the D3Graph constructor again
    this.points = Array.from(
        this.modelData.get('points').get(this.params.location),
        ([variant, variantMap]) => variantMap
      )
      .filter((pt) => !isNaN(pt.get(this.params.key)))
  }
  this.svg.append('g')
    .selectAll(".dot")
    .data(this.points)
    .enter()
    .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => this.x(d.get('variant')))
      .attr("cy", (d) => this.y(d.get(this.params.key)))
      .attr("r", this.styles.points.circle.r.normal)
      .style("fill", (d) => this.modelData.get('variantColors').get(d.get('variant')) ||  this.modelData.get('variantColors').get('other'))
      .call((sel) => {
        if (typeof this.params.tooltipPt!=="function") return;
        sel.on("mouseover", (event, d) => this.tooltip.display(this.params.tooltipPt, d, this.params))
        sel.on("mousemove", (event) => this.tooltip.move(event))
        sel.on("mouseout", () => this.tooltip.hide())
      })
  if (this.params.interval) {
    this.svg.append('g')
      .selectAll(".hdi")
      .data(this.points)
      .enter()
      .append('path')
        .attr('class', 'hdi')
        .attr("fill", "none")
        .attr("stroke", (d) => this.modelData.get('variantColors').get(d.get('variant')) ||  this.modelData.get('variantColors').get('other'))
        .attr("stroke-width", 3)
        .style("stroke-opacity", this.styles.points.confidence.opacity.normal)
        .attr("d", (d) => `M ${this.x(d.get('variant'))} ${this.y(d.get(this.params.interval[0]))} L ${this.x(d.get('variant'))} ${this.y(d.get(this.params.interval[1]))}`)
        .call((sel) => {
          if (typeof this.params.tooltipPt!=="function") return;
          sel.on("mouseover", (event, d) => this.tooltip.display(this.params.tooltipPt, d, this.params))
          sel.on("mousemove", (event) => this.tooltip.move(event))
          sel.on("mouseout", () => this.tooltip.hide())
        })
  }
}

D3Graph.prototype.annotateFinalPoint = function() {
  if (!(this.params.graphType==="lines" && this.params.annotateFinalPoint===true)) return;
  const g = this.svg
    .append('g')
    .attr("class", "annotation")
  this.modelData.get('points').get(this.params.location).forEach((variantPoint, variant) => {
    const temporalPoints = variantPoint.get('temporal');
    const finalPt = finalValidPoint(temporalPoints, 'R');
    const color = this.getVariantColor(variant);
    if (!finalPt) return;
    g.append("text")
      .text(`${parseFloat(finalPt.get('R')).toPrecision(2)}`)
      .attr("x", this.x(finalPt.get('date')))
      .attr("y", this.y(finalPt.get('R')))
      .style("text-anchor", "start")
      .style("alignment-baseline", "baseline")
      .style("font-size", "12px")
      .style("fill", color);
  });

}

D3Graph.prototype.updateScale = function(options) {
  if (this.params.graphType !== "lines") throw new Error("Not yet implemented")

  this.createScales(options, this.params); // updates this.x, this.y

  this.svg.selectAll('.yAxis')
    .transition().duration(TRANSITION_DURATION)
    .call(simpleYAxis(this.y, this.sizes, this.params.yTickFmt));

  this.modelData.get('points').get(this.params.location).forEach((variantPoint, variant) => {
    const temporalPoints = variantPoint.get('temporal');
    const g = this.svg.selectAll(`.${cssSafeName(`variant_${variant}`)}`)
    
    g.selectAll('.line')
      .transition().duration(TRANSITION_DURATION)
      .attr("d", this.line(temporalPoints))

    g.selectAll('.area')
      .transition().duration(TRANSITION_DURATION)
      .attr("d", this.area(temporalPoints))

    g.selectAll('.freqRawPoints') // may be empty - that's ok!
      .transition().duration(TRANSITION_DURATION)
      .attr("cy", (d) => this.y(d.get(`freq_raw`) || false))

    g.selectAll('.freqSmoothedPoints') // may be empty - that's ok!
      .transition().duration(TRANSITION_DURATION)
      .attr("cy", (d) => this.y(d.get(`freq_smoothed`) || false))
  });
}

D3Graph.prototype.setStyles = function(options) {
  /* The current responsiveSizing (Panels.js) sets the graph width. Common widths are 260px (small panels)
  or ~the available page width */
  const small = this.sizes.width < 300;

  this.styles = {};
  this.styles.rawFreqs = {
    daily: {
      r: small ? {normal: 1.1 , focusInactive: 1.1, focusActive: 2} : {normal: 2 , focusInactive: 2, focusActive: 3},
      opacity: {normal: 0.3 , focusInactive: 0, focusActive: 1},
      colorModifier: (color) => d3.color(color).darker(0.5).toString()
    }
  }
  this.styles.rawFreqs.weekly = {
    r: small ? {normal: 1.1 , focusInactive: 1.1, focusActive: 2} : {normal: 2 , focusInactive: 2, focusActive: 3},
    opacity: this.styles.rawFreqs.daily.opacity,
    colorModifier: (color) => d3.color(color).brighter(0.2).toString()
  }
  this.styles.lines = {
    line: {
      strokeWidth: {normal: 2 , focusInactive: 2, focusActive: 3},
      opacity: {normal: 0.8 , focusInactive: 0.3, focusActive: 1},
    },
    area: {
      opacity: {normal: 0.2 , focusInactive: 0, focusActive: 0.2},
    },
  }
  this.styles.points = {
    circle: {
      r: {normal: 4 , focusInactive: 3, focusActive: 6},
    },
    confidence: {
      opacity: {normal: 1 , focusInactive: 0.4, focusActive: 1},
    }
  }
}

/**
 * Prototype called when the frequency raw-data toggle is changed
 * NOTE: this used to be hardcoded to convey "daily", but this is no longer the case
 */
D3Graph.prototype.toggleDailyRawFreqPoints = function(options) {
  if (this.params.graphType !== "lines") throw new Error("Not yet implemented")
  if (!options.showDailyRawFreq) {
    this.svg.selectAll('.freqRawPoints').remove("*")
    return;
  }
  const key = 'freq_raw';
  this.modelData.get('points').get(this.params.location).forEach((variantPoint, variant) => {
    const temporalPoints = variantPoint.get('temporal')
      .filter((pt) => pt.has(key) && Number.isFinite(pt.get(key)))
    const variantColor = this.getVariantColor(variant) || 'black'
    const pointColor = this.styles.rawFreqs.daily.colorModifier(variantColor)

    this.svg.selectAll(`.${cssSafeName(`variant_${variant}`)}`)
      .selectAll("freqRawPoints")
      .data(temporalPoints)
      .enter()
      .append("circle")
        .attr("class", "freqRawPoints")
        .attr("cx", (d) => this.x(d.get('date')))
        .attr("cy", (d) => this.y(d.get(key) || false))
        .attr("r", this.styles.rawFreqs.daily.r.normal)
        .style("opacity", this.styles.rawFreqs.daily.opacity.normal)
        .style("fill", pointColor)
  })
}

/**
 * Prototype called when the smoothed (raw) data toggle is changed
 * NOTE: this used to be hardcoded to convey "weekly", but this is no longer the case
 */
D3Graph.prototype.toggleWeeklyRawFreqPoints = function(options) {
  if (this.params.graphType !== "lines") throw new Error("Not yet implemented")
  if (!options.showWeeklyRawFreq) {
    this.svg.selectAll('.freqSmoothedPoints').remove("*")
    return;
  }
  const key = `freq_smoothed`
  this.modelData.get('points').get(this.params.location).forEach((variantPoint, variant) => {
    const temporalPoints = variantPoint.get('temporal')
      .filter((pt) => pt.has(key) && Number.isFinite(pt.get(key)))

    const variantColor = this.getVariantColor(variant) || 'black';
    const pointColor = this.styles.rawFreqs.weekly.colorModifier(variantColor)

    this.svg.selectAll(`.${cssSafeName(`variant_${variant}`)}`)
      .selectAll("freqSmoothedPoints")
      .data(temporalPoints)
      .enter()
      .append("circle")
        .attr("class", "freqSmoothedPoints")
        .attr("cx", (d) => this.x(d.get('date')))
        .attr("cy", (d) => this.y(d.get(key) || false))
        .attr("r", this.styles.rawFreqs.weekly.r.normal)
        .style("opacity", this.styles.rawFreqs.weekly.opacity.normal)
        .style("fill", pointColor)
  })
}

D3Graph.prototype.setVariantFocus = function(selectedVariants) {
  const hasSelection = selectedVariants && selectedVariants.size > 0;

  if (this.params.graphType==="lines") {
    /* When a selection is active, non-selected variants go to focusInactive and
    each selected variant is then bumped up to focusActive. With no selection,
    everything is normal. */
    const baseState = hasSelection ? 'focusInactive' : 'normal';
    this.svg.selectAll('.freqRawPoints')
      .attr("r", this.styles.rawFreqs.daily.r[baseState])
      .style("opacity", this.styles.rawFreqs.daily.opacity[baseState])
    this.svg.selectAll('.freqSmoothedPoints')
      .attr("r", this.styles.rawFreqs.weekly.r[baseState])
      .style("opacity", this.styles.rawFreqs.weekly.opacity[baseState])
    this.svg.selectAll('.area')
      .style('opacity', this.styles.lines.area.opacity[baseState])
    this.svg.selectAll('.line')
      .style('opacity', this.styles.lines.line.opacity[baseState])
      .attr("stroke-width", this.styles.lines.line.strokeWidth[baseState])
    if (hasSelection) {
      for (const variant of selectedVariants) {
        const s = this.svg.selectAll(`.${cssSafeName(`variant_${variant}`)}`);
        s.selectAll('.freqRawPoints')
          .attr("r", this.styles.rawFreqs.daily.r.focusActive)
          .style("opacity", this.styles.rawFreqs.daily.opacity.focusActive)
        s.selectAll('.freqSmoothedPoints')
          .attr("r", this.styles.rawFreqs.daily.r.focusActive)
          .style("opacity", this.styles.rawFreqs.daily.opacity.focusActive)
        s.selectAll('.area')
          .style('opacity', this.styles.lines.area.opacity.focusActive)
        s.selectAll('.line')
          .style('opacity', this.styles.lines.line.opacity.focusActive)
          .attr("stroke-width", this.styles.lines.line.strokeWidth.focusActive)
      }
    }
  } else if (this.params.graphType==='points') {
    /* We don't modify circle opacities here as HPD lines with circles drawn over
    them don't look nice if both opacities are <1 */
    const focusState = (d) => {
      if (!hasSelection) return 'normal';
      if (selectedVariants.has(d.get('variant'))) return 'focusActive';
      return 'focusInactive';
    }
    this.svg.selectAll('.dot')
      .attr('r', (d) => this.styles.points.circle.r[focusState(d)])
    this.svg.selectAll('.hdi') /* empty selection if no interval data available */
      .style("stroke-opacity", (d) => this.styles.points.confidence.opacity[focusState(d)])
  }
}

/**
 * vertical (dashed) line + text to convey nowcast/forecast
 */
D3Graph.prototype.drawForecastLine = function() {
  if (this.params.graphType === "stream" ||
    !this.modelData.has('nowcastFinalDate') ||
    this.params.forecastLine !== true) {
    return;
  }

  const forecastGroup = this.svg.append('g')
  const forecastX = this.x(this.modelData.get('nowcastFinalDate'))
  forecastGroup.append('path')
    .attr("fill", "none")
    .attr("stroke", "#444")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 1)
    .attr("d", `M ${forecastX} ${this.y.range()[0]} L ${forecastX} ${this.y.range()[1]}`)
    .style("stroke-dasharray", "4 2")
    .style('pointer-events', 'none')
  /* rotate text (translate rather than x/y as rotation is relative to the origin) */
    forecastGroup.append("text")
      .text(`forecast`)
      .attr("transform", `translate(${forecastX+3},${this.y(1.0)+3})rotate(90)`)
      .style("font-size", "12px")
      .style("fill", '#aaa')
      .style('pointer-events', 'none')
}

D3Graph.prototype.drawDashedLines = function() {
  (this.params.dashedLines || []).forEach((yy) => {
    this.svg.append('path')
      .attr("fill", "none")
      .attr("stroke", "#444")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 1)
      .attr("d", `M ${this.x.range()[0]} ${this.y(yy)} L ${this.x.range()[1]} ${this.y(yy)}`)
      .style("stroke-dasharray", "4 2")
  })
}

D3Graph.prototype.title = function() {
  // top-left so we don't obscure any recent activity
  this.svg.append("text")
    .text(this.params.location) // todo -- allow customisation?
    .attr("x", this.sizes.left+5)
    .attr("y", this.sizes.top) // todo!
    .style("text-anchor", "start")
    .style("dominant-baseline", "hanging")
    .style("font-size", "16px")
    .style("fill", "#444");
}

D3Graph.prototype.getVariantColor = function(variant) {
  return this.modelData.get('variantColors').get(variant) || this.modelData.get('variantColors').get('other');
}

function svgSetup(dom, sizes) {
  dom.selectAll("*").remove();

  return dom.append("svg")
    .attr("width", sizes.width)
    .attr("height", sizes.height)
    .attr("viewBox", `0 0 ${sizes.width} ${sizes.height}`);
}

function invertScalePoint(xPx) {
  /* xPx is a value within x.range() */
  const range = this.range(), domain = this.domain();
  const rangePoints = d3.range(range[0], range[1], this.step())
  return  domain[d3.bisect(rangePoints, xPx) -1];
}


function simpleYAxis(y, sizes, textFun = (d) => d) {
  return (g) => g
    .attr("transform", `translate(${sizes.left},0)`)
    .call(d3.axisLeft(y).tickSize(2).tickPadding(4))
    // .call(g => g.select(".domain").remove())
    .selectAll("text")
      .text(textFun)
      .style("font-size", "12px")
      .style("fill", "#aaa");
}

function finalValidPoint(points, key) {
  for (let i=points.length-1; i>0; i--) {
    if (!isNaN(points[i].get(key))) return points[i];
  }
  return null;
}