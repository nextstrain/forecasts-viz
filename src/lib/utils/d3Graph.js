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

  this.createScales(options);
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


D3Graph.prototype.createScales = function({logit}) {
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
      this.y = d3.scaleLinear()
        .domain(customYDomain)
      break;
    default:
      throw new Error("TODO!");
    }
    this.x.range([this.sizes.left, this.sizes.width-this.sizes.right]);
    this.y.range([this.sizes.height-this.sizes.bottom, this.sizes.top]); // y=0 is @ top. Range is [bottom_y, top_y] which maps 0 to the bottom and 1 to the top (of the graph)
}

D3Graph.prototype.drawAxes = function() {
  // stream + lines are temporal, points are by variant
  const xTickFmt = this.params.graphType==="points" ?
    (variant) => this.modelData.get('variantDisplayNames').get(variant) || variant :
    dateFormatter;
  this.svg.append("g")
    .call(generalXAxis(this.x, this.sizes, xTickFmt));
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
        .attr("opacity", 0.2)
        .attr("d", this.area(temporalPoints))
        .style('pointer-events', 'none')
    }

    g.append('path')
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.8)
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
    .selectAll("dot")
    .data(this.points)
    .enter()
    .append("circle")
      .attr("cx", (d) => this.x(d.get('variant')))
      .attr("cy", (d) => this.y(d.get(this.params.key)))
      .attr("r", 4)
      .style("fill", (d) => this.modelData.get('variantColors').get(d.get('variant')) ||  this.modelData.get('variantColors').get('other'))
      .call((sel) => {
        if (typeof this.params.tooltipPt!=="function") return;
        sel.on("mouseover", (event, d) => this.tooltip.display(this.params.tooltipPt, d, this.params))
        sel.on("mousemove", (event) => this.tooltip.move(event))
        sel.on("mouseout", () => this.tooltip.hide())
      })
  if (this.params.interval) {
    this.svg.append('g')
      .selectAll("HDI")
      .data(this.points)
      .enter()
      .append('path')
        .attr("fill", "none")
        .attr("stroke", (d) => this.modelData.get('variantColors').get(d.get('variant')) ||  this.modelData.get('variantColors').get('other'))
        .attr("stroke-width", 3)
        .attr("stroke-opacity", 1)
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

  this.createScales(options); // updates this.x, this.y

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

    g.selectAll('.dailyRawFreqPoints') // may be empty - that's ok!
      .transition().duration(TRANSITION_DURATION)
      .attr("cy", (d) => this.y(d.get(`daily_raw_freq`) || false))

    g.selectAll('.weeklyRawFreqPoints') // may be empty - that's ok!
      .transition().duration(TRANSITION_DURATION)
      .attr("cy", (d) => this.y(d.get(`weekly_raw_freq`) || false))
  });
}

const rawFrequencyStyles = {
    daily:  {
      r: 1.1, rFocus: 3,
      opacity: 0.3, opacityFocus: 1,
      colorModifier: (color) => d3.color(color).darker(0.5).toString()
    },
    weekly: {
      r: 1.6, rFocus: 4,
      opacity: 0.3, opacityFocus: 1,
      colorModifier: (color) => d3.color(color).brighter(0.2).toString()
    },
}

/**
 * Prototype called when the "Daily raw data" toggle is changed
 */
D3Graph.prototype.toggleDailyRawFreqPoints = function(options) {
  if (this.params.graphType !== "lines") throw new Error("Not yet implemented")
  if (!options.showDailyRawFreq) {
    this.svg.selectAll('.dailyRawFreqPoints').remove("*")
    return;
  }
  const key = `daily_raw_freq`
  this.modelData.get('points').get(this.params.location).forEach((variantPoint, variant) => {
    const temporalPoints = variantPoint.get('temporal')
      .filter((pt) => pt.has(key) && Number.isFinite(pt.get(key)))

    const variantColor = this.getVariantColor(variant);
    const pointColor = rawFrequencyStyles.daily.colorModifier(variantColor)

    this.svg.selectAll(`.${cssSafeName(`variant_${variant}`)}`)
      .selectAll("dailyRawFreqPoints")
      .data(temporalPoints)
      .enter()
      .append("circle")
        .attr("class", "dailyRawFreqPoints")
        .attr("cx", (d) => this.x(d.get('date')))
        .attr("cy", (d) => this.y(d.get(key) || false))
        .attr("r", rawFrequencyStyles.daily.r)
        .style("opacity", rawFrequencyStyles.daily.opacity)
        .style("fill", pointColor)
  })
}

/**
 * Prototype called when the "7-day smoothed data" toggle is changed
 */
D3Graph.prototype.toggleWeeklyRawFreqPoints = function(options) {
  if (this.params.graphType !== "lines") throw new Error("Not yet implemented")
  if (!options.showWeeklyRawFreq) {
    this.svg.selectAll('.weeklyRawFreqPoints').remove("*")
    return;
  }
  const key = `weekly_raw_freq`
  this.modelData.get('points').get(this.params.location).forEach((variantPoint, variant) => {
    const temporalPoints = variantPoint.get('temporal')
      .filter((pt) => pt.has(key) && Number.isFinite(pt.get(key)))

    const variantColor = this.getVariantColor(variant);
    const pointColor = rawFrequencyStyles.weekly.colorModifier(variantColor)

    this.svg.selectAll(`.${cssSafeName(`variant_${variant}`)}`)
      .selectAll("weeklyRawFreqPoints")
      .data(temporalPoints)
      .enter()
      .append("circle")
        .attr("class", "weeklyRawFreqPoints")
        .attr("cx", (d) => this.x(d.get('date')))
        .attr("cy", (d) => this.y(d.get(key) || false))
        .attr("r", rawFrequencyStyles.weekly.r)
        .style("opacity", rawFrequencyStyles.weekly.opacity)
        .style("fill", pointColor)
  })
}

D3Graph.prototype.changeRawFreqPointsFocus = function(legendSwatchHovered) {
  if (legendSwatchHovered===undefined) {
    this.svg.selectAll('.dailyRawFreqPoints')
      .attr("r", rawFrequencyStyles.daily.r)
      .style("opacity", rawFrequencyStyles.daily.opacity)
    this.svg.selectAll('.weeklyRawFreqPoints')
      .attr("r", rawFrequencyStyles.weekly.r)
      .style("opacity", rawFrequencyStyles.weekly.opacity)
  } else {
    const s = this.svg.selectAll(`.${cssSafeName(`variant_${legendSwatchHovered}`)}`);
    s.selectAll('.dailyRawFreqPoints')
      .attr("r", rawFrequencyStyles.daily.rFocus)
      .style("opacity", rawFrequencyStyles.daily.opacityFocus)
    s.selectAll('.weeklyRawFreqPoints')
      .attr("r", rawFrequencyStyles.weekly.rFocus)
      .style("opacity", rawFrequencyStyles.weekly.opacityFocus)
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

function generalXAxis(x, sizes, textFn) {
  return (g) => g
    .attr("transform", `translate(0,${sizes.height - sizes.bottom})`)
    .call(d3.axisBottom(x).tickSize(0))
    // .call(g => g.select(".domain").remove())
    .selectAll("text")
      .text(textFn)
      // .attr("y", 0)
      // .attr("x", (d) => x(d))
      .attr("dy", "0.6em")
      .attr("transform", "rotate(45)")
      .style("text-anchor", "start")
      .style("font-size", "12px")
      .style("fill", "#aaa");
}

function dateFormatter(dStr) {
  const date = d3.timeParse("%Y-%m-%d")(dStr);
  if (parseInt(d3.timeFormat("%d")(date), 10)===1) {
    return `${d3.timeFormat("%b")(date)}`;
  }
  return '';
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