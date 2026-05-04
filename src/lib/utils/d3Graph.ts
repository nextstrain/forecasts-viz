import * as d3 from "d3";
import { logitScale } from "./logitScale";
import { Tooltip } from "./tooltip";
import { cssSafeName } from "./cssSafeName";
import { ModelData } from "./modelData.types";
import type { GraphParamsWithLocation } from "./graphParams";
import type { Controls } from '../hooks/useControls';
const TRANSITION_DURATION = 700;

/* todo -- progressively replace `any` types with proper definitions */
export interface D3GraphInstance {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  tooltip: any;
  modelData: ModelData;
  params: GraphParamsWithLocation;
  controls: Controls;
  sizes: any;
  emptyData: boolean;
  x: any;
  y: any;
  line: any;
  area: any;
  styles: any;
  points: any[];
  setStyles(): void;
  createScales(): void;
  drawXAxis(): void;
  drawYAxis(): void;
  setupTooltipXY(): void;
  setupLine(): void;
  setupArea(): void;
  drawLines(): void;
  drawPoints(): void;
  annotateFinalPoint(): void;
  updateScale(): void;
  togglePoints(key: 'raw'|'smoothed'): void;
  setVariantFocus(): void;
  drawForecastLine(): void;
  drawDashedLines(): void;
  title(): void;
  getVariantColor(variant: string): string;
}

export function D3Graph(this: D3GraphInstance, d3Container, sizes, modelData: ModelData, params: GraphParamsWithLocation, controls: Controls) {
  const dom = d3.select(d3Container.current);
  
  this.svg = svgSetup(dom, sizes);
  this.tooltip = new Tooltip(dom);
  this.modelData = modelData;
  this.params = params;
  this.controls = controls;
  this.sizes = sizes;
  this.setStyles();
  this.emptyData = false;

  this.createScales();
  this.drawXAxis();
  this.drawYAxis();

  this.setupTooltipXY();

  this.setupLine();
  this.setupArea();
  this.drawLines();
  this.drawPoints();
  /* Note: raw data points never drawn on initial render */

  this.drawForecastLine();
  this.drawDashedLines();
  this.annotateFinalPoint();
  this.title();
}


D3Graph.prototype.createScales = function (this: D3GraphInstance) {
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

  const applyLogit = this.controls.logit && this.params.canUseLogit;
  
  switch (this.params.graphType) {
    case "lines":
      this.x = d3.scalePoint()
        .domain(customXDomain || this.modelData.get('dates'))
      this.x.invert = invertScalePoint;
      this.y = (applyLogit ? logitScale() : d3.scaleLinear())
        .domain(customYDomain)
      break
    case "points":
      this.x = d3.scalePoint()
        .domain(customXDomain || [...this.modelData.get('variants')])
      this.y = (this.params.log2 ? d3.scaleLog().base(2): d3.scaleLinear())
        .domain(customYDomain)
      break;
    case "statespace":
      this.x = (applyLogit ? logitScale() : d3.scaleLinear())
        .domain(this.params.xDomain);
      this.y = d3.scaleLinear().domain(customYDomain)
      break;
    default:
      throw new Error("TODO!");
    }
    this.x.range([this.sizes.left, this.sizes.width-this.sizes.right]);
    this.y.range([this.sizes.height-this.sizes.bottom, this.sizes.top]); // y=0 is @ top. Range is [bottom_y, top_y] which maps 0 to the bottom and 1 to the top (of the graph)
}

D3Graph.prototype.drawXAxis = function (this: D3GraphInstance) {
  /** Statespace graph uses a simple linear graph (frequency) */

  if (this.params.graphType === 'statespace') {
    this.svg.append("g")
      .attr("class", "xAxis")
      .call(simpleAxis('x', this.x, this.sizes, d3.format(".0%")));
    return;
  }
  
  
  /**
   * X-axis. Note the scale is always `scalePoint`, so we must control the ticks to
   * show manually (i.e. can't use `axis.ticks()`)
   */
  // First work out which ticks to display and how to display them
  // `xTicks` is a dict of tick value -> displayed text.
  const xTicks = {};
  switch (this.params.graphType) {
    case "points":
      // display every variant (point in the domain)
      this.x.domain().forEach((variant) => {
        xTicks[variant] = this.modelData.get('variantDisplayNames').get(variant) || variant;
      });
      break;
    case "lines": // fallthrough
      if (this.modelData.get('sparseDates') === false) {
        // We have values for every day (i.e. no holes), so display a tick for
        // the first day of each month
        this.x.domain().forEach((dStr) => {
          const date = d3.timeParse("%Y-%m-%d")(dStr);
          if (d3.timeFormat("%d")(date) === '01') {
            xTicks[dStr] = `${d3.timeFormat("%b")(date)}`;
          }
        });
      } else {
        // sparse data - plot the first tick for each month encountered
        let _lastTick;
        this.x.domain().forEach((dStr, _i) => {
          const date = d3.timeParse("%Y-%m-%d")(dStr);
          const month = d3.timeFormat("%m")(date)
          if (month !== _lastTick) {
            // don't plot first tick (aesthetic reasons)
            if (_lastTick) {
              xTicks[dStr] = `${d3.timeFormat("%b %e")(date)}`;
            }
            _lastTick = month;
          }
        });
      }
      break;
  }
  
  switch (this.params.graphType) {
    case "points": // fallthrough
    case "lines":
      this.svg.append("g")
        .call((g) => g
          .attr("transform", `translate(0,${this.sizes.height - this.sizes.bottom})`)
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
      break;
  }
}


D3Graph.prototype.drawYAxis = function (this: D3GraphInstance) {
  this.svg.append("g")
    .attr("class", "yAxis")
    .call(simpleAxis('y', this.y, this.sizes, this.params.yTickFmt));
}

D3Graph.prototype.setupTooltipXY = function(this: D3GraphInstance) {
  if (typeof this.params.tooltipXY === "function") {
    this.tooltip.createMouseCaptureArea(this.svg, this.x, this.y, false) // todo = update if x,y change?
      .on("mousemove", (event) => this.tooltip.update(event, this.params.tooltipXY, this.modelData, this.params, this.controls.selectedVariants))
      .on("mouseout", () => this.tooltip.hide())
  }
}

D3Graph.prototype.setupLine = function(this: D3GraphInstance) {
  if (this.params.graphType==="points") return;
  if (this.params.graphType === 'statespace') {
    this.line = d3.line<any>()
      .defined(d => !!d)
      .curve(d3.curveLinear)
      .x((d) => this.x(d.freq))
      .y((d) => this.y(d.relativeGa))
    return;
  }
  this.line = d3.line<any>()
    .defined(d => !!d)
    .curve(d3.curveLinear)
    .x((d) => this.x(d.date))
    .y((d) => this.y(d.value))
}

D3Graph.prototype.setupArea = function(this: D3GraphInstance) {
  if (this.params.graphType==="points") return;
  if (!this.params.interval) return;
  this.area = d3.area<any>()
    .defined(d => !!d)
    .curve(d3.curveLinear)
    .x((d) => this.x(d.date))
    .y0((d) => this.y(d.lower))
    .y1((d) => this.y(d.upper))
}

D3Graph.prototype.drawLines = function (this: D3GraphInstance) {
  /**
   * Note: this approach (one <g> per variant) works, but there is an alternate
   * nested d3 approach we could alternatively use. See the commit which removed
   * streams for implementation details.
   */
  if (!['lines', 'statespace'].includes(this.params.graphType)) return;
  let dataExists = false;
  
  const locationData = this.modelData.get('points')[this.params.key]?.[this.params.location];
  if (locationData) Object.entries(locationData).forEach(([variant, data]: [string, any]) => {
    const temporalPoints = data?.temporal;
    if (!temporalPoints || temporalPoints.filter(Boolean).length === 0) return;
    dataExists = true;
    
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
  });
  this.emptyData = !dataExists;
}


D3Graph.prototype.drawPoints = function (this: D3GraphInstance) {
  if (this.params.graphType!=="points") return;
  
  if (!this.points) {
    // only computed once because a change in location or model data
    // runs the D3Graph constructor again
    const locationData = this.modelData.get('points')[this.params.key]?.[this.params.location] || {};
    this.points = Object.entries(locationData)
      .map(([variant, data]: [string, any]) => ({ variant, ...data }))
      .filter((pt) => !!pt && Number.isFinite(pt.value))
    if (this.points.length === 0) {
      this.emptyData = true;
      return; // quick exit from the render method
    }
  }
    
  this.svg.append('g')
    .selectAll(".dot")
    .data(this.points)
    .enter()
    .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => this.x(d.variant))
      .attr("cy", (d) => this.y(d.value))
      .attr("r", this.styles.points.circle.r.normal)
      .style("fill", (d) => this.modelData.get('variantColors').get(d.variant) ||  this.modelData.get('variantColors').get('other'))
      .call((sel) => {
        if (typeof this.params.tooltipPt!=="function") return;
        sel.on("mouseover", (_event, d) => this.tooltip.display(this.params.tooltipPt, d, this.params))
        sel.on("mousemove", (event) => this.tooltip.move(event))
        sel.on("mouseout", () => this.tooltip.hide())
      });
  if (this.params.interval) {
    this.svg.append('g')
      .selectAll(".hdi")
      .data(this.points)
      .enter()
      .append('path')
        .attr('class', 'hdi')
        .attr("fill", "none")
        .attr("stroke", (d) => this.modelData.get('variantColors').get(d.variant) ||  this.modelData.get('variantColors').get('other'))
        .attr("stroke-width", 3)
        .style("stroke-opacity", this.styles.points.confidence.opacity.normal)
        .attr("d", (d) => `M ${this.x(d.variant)} ${this.y(d.lower)} L ${this.x(d.variant)} ${this.y(d.upper)}`)
        .call((sel) => {
          if (typeof this.params.tooltipPt!=="function") return;
          sel.on("mouseover", (_event, d) => this.tooltip.display(this.params.tooltipPt, d, this.params))
          sel.on("mousemove", (event) => this.tooltip.move(event))
          sel.on("mouseout", () => this.tooltip.hide())
        })
  }
}

D3Graph.prototype.annotateFinalPoint = function (this: D3GraphInstance): void {
  if (this.params.annotateFinalPoint !== true) return;
  if (this.params.graphType !== 'statespace' || this.params.key !== 'freqGA') {
    throw new Error('annotateFinalPoint only for statespace + freqGA plots ')
  }

  let g = this.svg.select<SVGGElement>('g.annotation');
  if (g.empty()) {
    g = this.svg.append('g').attr("class", "annotation");
  }

  const locationData = this.modelData.get('points').freqGA?.[this.params.location];
  if (!locationData) return;
  const variantsSelected = this.controls.selectedVariants.size > 0;
  
  const circleData = Object.entries(locationData).flatMap(([variant, variantData]: [string, any]) => {
    const tIdx = _finalTemporalIdx(variantData.temporal);
    if (tIdx === false) return [];
    const point = variantData.temporal[tIdx];
    const isFilled = !variantsSelected || this.controls.selectedVariants.has(variant);
    const opaque = variantsSelected && !isFilled;
    return [{variant, point, isFilled, opaque, color: this.getVariantColor(variant)}];
  });

  g.selectAll<SVGCircleElement, typeof circleData[number]>("circle")
    .data(circleData, (d) => d.variant)
    .join("circle")
      .attr("cx", (d) => this.x(d.point.freq))
      .attr("cy", (d) => this.y(d.point.relativeGa))
      .attr("r", 4)
      .style('opacity', (d) => d.opaque ? this.styles.lines.line.opacity.focusInactive : 1 )
      .style("fill", (d) => d.isFilled ? d.color : "none")
      .style("stroke", (d) => d.isFilled ? "none" : d.color)
      .style("stroke-width", (d) => d.isFilled ? 0 : 2);
}

function _finalTemporalIdx(data: any[]): false|number {
  for (let i=data.length-1; i>0; i--) {
    if (data[i] !== undefined) return i;
  }
  return false;
}


/**
 * Update the scale type - this entails updating the d3 scale, re-drawing th axes,
 * and re-drawing any points/lines/intervals on the graph
 */
D3Graph.prototype.updateScale = function(this: D3GraphInstance) {
  if (!['lines', 'statespace'].includes(this.params.graphType)) throw new Error("Not yet implemented")

  this.createScales(); // updates this.x, this.y

  switch (this.params.graphType) {
    case "lines":
      this.svg.selectAll('.yAxis')
        .transition().duration(TRANSITION_DURATION)
        .call(simpleAxis('y', this.y, this.sizes, this.params.yTickFmt));
      break;
    case "statespace":
      this.svg.selectAll('.xAxis')
        .transition().duration(TRANSITION_DURATION)
        .call(simpleAxis('x', this.x, this.sizes, d3.format(".0%")));
      break;
  }

  const updateLocationData = this.modelData.get('points')[this.params.key]?.[this.params.location];
  if (updateLocationData) Object.entries(updateLocationData).forEach(([variant, data]: [string, any]) => {
    const temporalPoints = data.temporal
    if (temporalPoints.filter(Boolean).length === 0) return;
    const g = this.svg.selectAll(`.${cssSafeName(`variant_${variant}`)}`)

    g.selectAll('.line')
      .transition().duration(TRANSITION_DURATION)
      .attr("d", this.line(temporalPoints))

    if (this.area) {
      g.selectAll('.area')
        .transition().duration(TRANSITION_DURATION)
        .attr("d", this.area(temporalPoints))
    }
    g.selectAll('.freqRawPoints') // may be empty - that's ok!
      .transition().duration(TRANSITION_DURATION)
      .attr("cy", (d) => this.y(d.raw || false))

    g.selectAll('.freqSmoothedPoints') // may be empty - that's ok!
      .transition().duration(TRANSITION_DURATION)
      .attr("cy", (d) => this.y(d.smoothed || false))
  });

  // Move the circles attached to the end of lines in statespace graph if applicable
  this.svg.select('g.annotation').selectAll('circle')
    .transition().duration(TRANSITION_DURATION)
    .attr("cx", (d) => this.x(d.point.freq));

}

D3Graph.prototype.setStyles = function(this: D3GraphInstance) {
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
 * Toggle individual data points (to be shown behind lines)
 * (The hardcoded raw/daily & freq strings are remnants from earlier versions)
 */
D3Graph.prototype.togglePoints = function(this: D3GraphInstance, key: 'raw'|'smoothed') {
  if (this.params.graphType !== "lines") throw new Error("Not yet implemented")
  const className = key === 'raw' ? 'freqRawPoints' : 'freqSmoothedPoints';
  if (!this.controls[key === 'raw' ? 'showDailyRawFreq' : 'showWeeklyRawFreq']) {
    this.svg.selectAll(`.${className}`).remove("*")
    return;
  }
  const freqLocationData = this.modelData.get('points').freq?.[this.params.location];
  if (freqLocationData) Object.entries(freqLocationData).forEach(([variant, freqData]: [string, any]) => {
    const temporalPoints = freqData.temporal
      .filter((pt) => pt?.raw !== undefined)
    const variantColor = this.getVariantColor(variant) || 'black'
    const _baseColor = this.styles.rawFreqs[key === 'raw' ? 'daily' : 'weekly'];
    const pointColor = _baseColor.colorModifier(variantColor)
    const styles = this.styles.rawFreqs[key === 'raw' ? 'daily' : 'weekly'];
    this.svg.selectAll(`.${cssSafeName(`variant_${variant}`)}`)
      .selectAll(className)
      .data(temporalPoints)
      .enter()
      .append("circle")
        .attr("class", className)
        .attr("cx", (d) => this.x(d.date))
        .attr("cy", (d) => this.y(d.raw))
        .attr("r", styles.r.normal)
        .style("opacity", styles.opacity.normal)
        .style("fill", pointColor)
  })
}

D3Graph.prototype.setVariantFocus = function (this: D3GraphInstance) {
  const hasSelection = this.controls.selectedVariants.size > 0;
  
  if (this.params.graphType==="lines" || this.params.graphType==="statespace") {
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
      for (const variant of this.controls.selectedVariants) {
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
    this.annotateFinalPoint();
    
  } else if (this.params.graphType==='points') {
    /* We don't modify circle opacities here as HPD lines with circles drawn over
    them don't look nice if both opacities are <1 */
    const focusState = (d) => {
      if (!hasSelection) return 'normal';
      if (this.controls.selectedVariants.has(d.variant)) return 'focusActive';
      return 'focusInactive';
    }
    this.svg.selectAll('.dot')
      .attr('r', (d) => this.styles.points.circle.r[focusState(d)])
    this.svg.selectAll('.hdi') /* empty selection if no interval data available */
      .style("stroke-opacity", (d) => this.styles.points.confidence.opacity[focusState(d)])
  }
}

/**
 * vertical (dashed) line + text to convey nowcast/forecast boundary
 */
D3Graph.prototype.drawForecastLine = function(this: D3GraphInstance) {
  if (!this.modelData.has('nowcastFinalDate') || this.params.forecastLine !== true) {
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

D3Graph.prototype.drawDashedLines = function(this: D3GraphInstance) {
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

D3Graph.prototype.title = function(this: D3GraphInstance) {
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

D3Graph.prototype.getVariantColor = function(this: D3GraphInstance, variant) {
  return this.modelData.get('variantColors').get(variant) || this.modelData.get('variantColors').get('other');
}

function svgSetup(dom, sizes) {
  dom.selectAll("*").remove();

  return dom.append("svg")
    .attr("width", sizes.width)
    .attr("height", sizes.height)
    .attr("viewBox", `0 0 ${sizes.width} ${sizes.height}`);
}

function invertScalePoint(this: any, xPx) { // todo - `this` is the d3 scalePoint
  /* xPx is a value within x.range() */
  const range = this.range(), domain = this.domain();
  const rangePoints = d3.range(range[0], range[1], this.step())
  return  domain[d3.bisect(rangePoints, xPx) -1];
}


function simpleAxis(axis: 'x' | 'y', scale: d3.AxisScale<d3.AxisDomain>, sizes: any, textFun: (d: any) => string = (d) => d) {
  const isX = axis === 'x';
  const transform = isX
    ? `translate(0,${sizes.height-sizes.bottom})`
    : `translate(${sizes.left},0)`;
  const axisFn = isX ? d3.axisBottom(scale) : d3.axisLeft(scale);
  return (g: d3.Selection<SVGGElement, unknown, any, unknown> | d3.Transition<any, unknown, any, unknown>): d3.Selection<SVGTextElement, unknown, SVGGElement, unknown> => {
    const texts = (g as d3.Selection<SVGGElement, unknown, any, unknown>)
      .attr("transform", transform)
      .call(axisFn.tickSize(2).tickPadding(4))
      .selectAll<SVGTextElement, unknown>("text")
        .text(textFun)
        .style("font-size", "12px")
        .style("fill", "#aaa");
    if (isX) {
      texts
        .attr("transform", "rotate(45)")
        .style("text-anchor", "start");
    }
    return texts;
  };
}
