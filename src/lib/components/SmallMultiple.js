import React, {useEffect, useRef} from 'react';
import styled from 'styled-components';
import * as d3 from "d3";
import { logitScale } from "../utils/logitScale";
import { Tooltip } from "../utils/tooltip";

/**
 * A lot of these functions can be broken out into custom hooks / separate files.
 * But for now, this is easier...
 * @private
 */

const D3Container = styled.div`
  /* border: dashed blue; */
`;

const dateFormatter = (dStr) => {
  const date = d3.timeParse("%Y-%m-%d")(dStr);
  if (parseInt(d3.timeFormat("%d")(date), 10)===1) {
    return `${d3.timeFormat("%b")(date)}`;
  }
  return '';
}

const generalXAxis = (x, sizes, textFn) => {
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

const simpleYAxis = (y, sizes, textFun = (d) => d) => (g) => g
  .attr("transform", `translate(${sizes.left},0)`)
  .call(d3.axisLeft(y).tickSize(2).tickPadding(4))
  // .call(g => g.select(".domain").remove())
  .selectAll("text")
    .text(textFun)
    .style("font-size", "12px")
    .style("fill", "#aaa");

const svgSetup = (dom, sizes) => {
  dom.selectAll("*").remove();

  return dom.append("svg")
    .attr("width", sizes.width)
    .attr("height", sizes.height)
    .attr("viewBox", `0 0 ${sizes.width} ${sizes.height}`);
}

const title = (svg, sizes, text) => {
  // top-left so we don't obscure any recent activity
  svg.append("text")
    .text(text)
    .attr("x", sizes.left+5)
    .attr("y", sizes.top) // todo!
    .style("text-anchor", "start")
    .style("dominant-baseline", "hanging")
    .style("font-size", "16px")
    .style("fill", "#444");
}

const frequencyPlot = (dom, sizes, location, modelData, logit) => {
  const svg = svgSetup(dom, sizes);
  const tooltip = new Tooltip(dom);

  const x = d3.scalePoint()
    .domain(modelData.get('dates'))
    .range([sizes.left, sizes.width-sizes.right]);
  x.invert = invertScalePoint;

  svg.append("g")
      .call(generalXAxis(x, sizes, dateFormatter));

  const y = (logit ? logitScale() : d3.scaleLinear())
    .domain([0, 1])
    .range([sizes.height-sizes.bottom, sizes.top]); // y=0 is @ top. Range is [bottom_y, top_y] which maps 0 to the bottom and 1 to the top (of the graph)

  svg.append("g")
    .call(simpleYAxis(y, sizes, d3.format(".0%")));

  tooltip.createMouseCaptureArea(svg, x, y, false) // todo = update if x,y change!
    .on("mousemove", (event) => tooltip.update(event, displayFrequencySummary, modelData.get('dateIdx'), modelData.get('points').get(location)))
    .on("mouseout", () => tooltip.hide())

  /* coloured lines for each variant, with shaded areas for HDI. Note the similarities with R_t! */
  const line = d3.line()
    .defined(d => !isNaN(d.get('freq')) && !!d.get('date'))
    .curve(d3.curveLinear)
    .x((d) => x(d.get('date')))
    .y((d) => y(d.get('freq')))
  const area = d3.area()
    .defined(d => d.get('freq_HDI_95_lower')!==undefined && d.get('freq_HDI_95_upper')!==undefined && !!d.get('date'))
    .curve(d3.curveLinear)
    .x((d) => x(d.get('date')))
    .y0((d) => y(d.get('freq_HDI_95_lower')))
    .y1((d) => y(d.get('freq_HDI_95_upper')))

  modelData.get('points').get(location).forEach((variantPoint, variant) => {
    const temporalPoints = variantPoint.get('temporal');
    const color = modelData.get('variantColors').get(variant) || modelData.get('variantColors').get('other');
    const g = svg.append('g');

    g.append('path')
      .attr("stroke", "none")
      .attr("fill", color)
      .attr("opacity", 0.2)
      .attr("d", area(temporalPoints))
      .style('pointer-events', 'none')

    g.append('path')
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.8)
      .attr("d", line(temporalPoints))
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

  /* vertical (dashed) line + text to convey nowcast/forecast */
  /* dashed horizontal line at R=1 */
  const forecastGroup = svg.append('g')
  const forecastX = x(modelData.get('nowcastFinalDate'))
  forecastGroup.append('path')
    .attr("fill", "none")
    .attr("stroke", "#444")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 1)
    .attr("d", `M ${forecastX} ${y(0.0)} L ${forecastX} ${y(1.0)}`)
    .style("stroke-dasharray", "4 2")
    .style('pointer-events', 'none')
  /* rotate text (translate rather than x/y as rotation is relative to the origin) */
    forecastGroup.append("text")
      .text(`forecast`)
      .attr("transform", `translate(${forecastX+3},${y(1.0)+3})rotate(90)`)
      .style("font-size", "12px")
      .style("fill", '#aaa')
      .style('pointer-events', 'none')


  title(svg, sizes, location)
}


const rtPlot = (dom, sizes, location, modelData) => {
  // todo: y-axis domain depending on data

  const svg = svgSetup(dom, sizes);

  const x = d3.scalePoint()
    .domain(modelData.get('dates'))
    .range([sizes.left, sizes.width-sizes.right]);

  svg.append("g")
      .call(generalXAxis(x, sizes, dateFormatter));

  const y = d3.scaleLinear()
    // .domain(modelData.get('domains').get('rt'))
    .domain([0, 3])
    .range([sizes.height-sizes.bottom, sizes.top]); // y=0 is @ top. Range is [bottom_y, top_y] which maps 0 to the bottom and 1 to the top (of the graph)

  svg.append("g")
    .call(simpleYAxis(y, sizes));

  /* coloured lines for each variant, with shaded areas for HDI */
  const line = d3.line()
    .defined(d => !isNaN(d.get('R')))
    .curve(d3.curveLinear)
    .x((d) => x(d.get('date')))
    .y((d) => y(d.get('R')))
  const area = d3.area()
    .defined(d => d.get('R_HDI_95_lower')!==undefined && d.get('R_HDI_95_upper')!==undefined)
    .curve(d3.curveLinear)
    .x((d) => x(d.get('date')))
    .y0((d) => y(d.get('R_HDI_95_lower')))
    .y1((d) => y(d.get('R_HDI_95_upper')))

  modelData.get('points').get(location).forEach((variantPoint, variant) => {
    const temporalPoints = variantPoint.get('temporal');
    const color = modelData.get('variantColors').get(variant) || modelData.get('variantColors').get('other');
    const g = svg.append('g');

    g.append('path')
      .attr("stroke", "none")
      .attr("fill", color)
      .attr("opacity", 0.2)
      .attr("d", area(temporalPoints));

    g.append('path')
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.8)
      .attr("d", line(temporalPoints));

    const finalPt = finalValidPoint(temporalPoints, 'R');
    if (!finalPt) return;
    g.append("text")
      .text(`${parseFloat(finalPt.get('R')).toPrecision(2)}`)
      .attr("x", x(finalPt.get('date')))
      .attr("y", y(finalPt.get('R')))
      .style("text-anchor", "start")
      .style("alignment-baseline", "baseline")
      .style("font-size", "12px")
      .style("fill", color)
  });

  /* dashed horizontal line at R=1 */
  svg.append('path')
    .attr("fill", "none")
    .attr("stroke", "#444")
    .attr("stroke-width", 1)
    .attr("stroke-opacity", 1)
    .attr("d", `M ${sizes.left} ${y(1.0)} L ${sizes.width-sizes.right} ${y(1.0)}`)
    .style("stroke-dasharray", "4 2")

  title(svg, sizes, location)
}

const stackedIncidence = (dom, sizes, location, modelData) => {
  const svg = svgSetup(dom, sizes);

  const x = d3.scalePoint()
    .domain(modelData.get('dates'))
    .range([sizes.left, sizes.width-sizes.right]);

  svg.append("g")
      .call(generalXAxis(x, sizes, dateFormatter));

  /* maximum value by looking at final variant (i.e. on top of the stack) */
  const variants = modelData.get('variants');
  const dataPerVariant = modelData.get('points').get(location)
  const maxI = d3.max(
    dataPerVariant.get(variants[variants.length-1]).get('temporal')
      .map((point) => point.get('I_smooth_y1'))
  );

  const y = d3.scaleLinear()
    .domain([0, maxI])
    .range([sizes.height-sizes.bottom, sizes.top]); // y=0 is @ top. Range is [bottom_y, top_y] which maps 0 to the bottom and 1 to the top (of the graph)

  svg.append("g")
    .call(simpleYAxis(y, sizes, d3.format("~s")));

  svg.append('g')
    .selectAll("stackedLayer")
    .data(variants)
    .enter()
    .append("path")
      .style("fill", (variant) => modelData.get('variantColors').get(variant) || modelData.get('variantColors').get('other'))
      .style("fill-opacity", 0.5)
      .style("stroke", (variant) => modelData.get('variantColors').get(variant) || modelData.get('variantColors').get('other'))
      .style("stroke-width", 0.5)
      .attr("d", (variant) => (d3.area()
        .defined((point) => !!point.get('date'))
        .x((point) => x(point.get('date')))
        .y0((point) => y(point.get('I_smooth_y0')))
        .y1((point) => y(point.get('I_smooth_y1')))
      )(dataPerVariant.get(variant).get('temporal')))

  title(svg, sizes, location)
}



const categoryPointEstimate = (dom, sizes, location, modelData, dataKey, dashedLineY) => {
  const svg = svgSetup(dom, sizes);
  const tooltip = new Tooltip(dom);

  // Removes the pivot category that does not need to be plotted.
  const x = d3.scalePoint()
    .domain(['', ...modelData.get('variants').filter(v => v !== modelData.get('pivot'))])
    .range([sizes.left, sizes.width-sizes.right]);

  svg.append("g")
    .call(generalXAxis(x, sizes, (variant) => modelData.get('variantDisplayNames').get(variant) || variant));

  const points = Array.from(
      modelData.get('points').get(location),
      ([variant, variantMap]) => variantMap
    )
    .filter((pt) => !isNaN(pt.get(dataKey.key)))

  const y = d3.scaleLinear()
    .domain(modelData.get('domains').get('ga'))
    .range([sizes.height-sizes.bottom, sizes.top]); // y=0 is @ top. Range is [bottom_y, top_y] which maps 0 to the bottom and 1 to the top (of the graph)

  svg.append("g")
    .call(simpleYAxis(y, sizes));

  if (dashedLineY!==undefined) {
    svg.append('path')
      .attr("fill", "none")
      .attr("stroke", "#444")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 1)
      .attr("d", `M ${x.range()[0]} ${y(dashedLineY)} L ${x.range()[1]} ${y(dashedLineY)}`)
      .style("stroke-dasharray", "4 2")
  }

  svg.append('g')
    .selectAll("dot")
    .data(points)
    .enter()
    .append("circle")
      .attr("cx", (d) => x(d.get('variant')))
      .attr("cy", (d) => y(d.get(dataKey.key)))
      .attr("r", 4)
      .style("fill", (d) => modelData.get('variantColors').get(d.get('variant')) ||  modelData.get('variantColors').get('other'))
      .on("mouseover", (event, d) => tooltip.display(categoryPointTooltip, d, dataKey))
      .on("mousemove", (event) => tooltip.move(event))
      .on("mouseout", () => tooltip.hide())

  svg.append('g')
    .selectAll("HDI")
    .data(points)
    .enter()
    .append('path')
      .attr("fill", "none")
      .attr("stroke", (d) => modelData.get('variantColors').get(d.get('variant')) ||  modelData.get('variantColors').get('other'))
      .attr("stroke-width", 3)
      .attr("stroke-opacity", 1)
      .attr("d", (d) => `M ${x(d.get('variant'))} ${y(d.get(dataKey.key+"_HDI_95_lower"))} L ${x(d.get('variant'))} ${y(d.get(dataKey.key+"_HDI_95_upper"))}`)
      .on("mouseover", (event, d) => tooltip.display(categoryPointTooltip, d, dataKey))
      .on("mousemove", (event) => tooltip.move(event))
      .on("mouseout", () => tooltip.hide())

  title(svg, sizes, location)
}

export const canUseLogit = new Set(['frequency']);

export const SmallMultiple = ({location, graph, sizes, modelData, logit}) => {

  const d3Container = useRef(null);

  useEffect(
    () => {
      const dom = d3.select(d3Container.current);

      switch (graph) {
        case 'frequency':
          frequencyPlot(dom, sizes, location, modelData, logit);
          break;
        case 'R':
          rtPlot(dom, sizes, location, modelData);
          break;
        case 'stackedIncidence':
          stackedIncidence(dom, sizes, location, modelData);
          break;
        case 'growthAdvantage':
          categoryPointEstimate(dom, sizes, location, modelData, {key: 'ga', name: 'Growth Advantage'}, 1.0);
          break;
        default:
          console.error(`Unknown graph type ${graph}`)
      }

    },
    [modelData, graph, sizes, location, logit]
  );

  return (
    <D3Container ref={d3Container}/>
  )
}

function finalValidPoint(points, key) {
  for (let i=points.length-1; i>0; i--) {
    if (!isNaN(points[i].get(key))) return points[i];
  }
  return null;
}

/**
 * @param {Map} d ("d" for d3 datum)
 * @param {object} dataKey {key, name} 
 * @returns {HtmlString}
 * @private
 */
function categoryPointTooltip(d, dataKey) {
  const fmt = d3.format(".1f");
  return `
    <div>
      <p><b>Variant:</b> ${d.get('variant')}</p>
      <p><b>${dataKey.name}:</b> ${fmt(d.get(`${dataKey.key}`))}</p>
      <p><b>95% HDI:</b> ${fmt(d.get(`${dataKey.key}_HDI_95_lower`))} - ${fmt(d.get(`${dataKey.key}_HDI_95_upper`))}</p>
    </div>
  `
}

function displayFrequencySummary(xy, dateIdx, locationData) {
  const xIdx = dateIdx.get(xy[0]);
  let freqs = [];
  locationData.forEach((variantPoint, variant) => {
    const d = variantPoint.get('temporal')[xIdx];
    if (d.get('date') && d.get('freq')) {
      freqs.push([variant, d.get('freq')])
    }
  });
  const fmt = d3.format(".1%");
  let top5 = ''
  freqs.sort((a, b) => a[1]>b[1] ? -1 : 1)
    .slice(0, 5) // take the top 5 variants (highest frequencies)
    .forEach((d) => {
      top5+=`<p><b>${d[0]}</b> ${fmt(d[1])}</p>`
    })
  return `
    <div>
      <p><b>Date:</b> ${xy[0]}</p>
      <p><b>Top 5 variants:</p>
      ${top5}
    </div>
  `
}

function invertScalePoint(xPx) {
  /* xPx is a value within x.range() */
  const range = this.range(), domain = this.domain();
  const rangePoints = d3.range(range[0], range[1], this.step())
  return  domain[d3.bisect(rangePoints, xPx) -1];
}
