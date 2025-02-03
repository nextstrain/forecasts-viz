import React, { useRef } from 'react';
import styled from 'styled-components';
import { useGraph } from "../utils/useGraph";
import { displayTopVariants, categoryPointTooltip} from "../utils/tooltipDisplay";
import * as d3 from "d3";

const D3Container = styled.div`
  /* border: dashed blue; */
`;

/**
 * @typedef {Object} GraphParameters
 * Configuration for how a graph is to be visualised. All/any of these properties may be set by
 * the <PanelDisplay> component. If a preset is set then it will be expanded into a meaningful
 * set of these properties (see `expandParams()`).
 *
 * Note that a deep equality check will be used to decide when (if) the params for an individual
 * small-multiple have changes and the graph should therefore re-draw. Because functions are
 * compared by reference you must memoize any functions or provide a consistent reference to them.
 * A common case to avoid is defining the function within a react component (or within the prop
 * declaration), as that function will be re-created each time the component renders.
 *
 * @property {("stackedIncidence" | "R_t" | "growthAdvantage" | "frequency")} [preset]
 *      Load a set of preset parameters. Any parameters re-defined here will overwrite those which come from the preset.
 * @property {("points" | "lines" | "stream")} [graphType]
 * @property {String} [key]
 * @property {String[]} [interval]
 * @property {Number} [intervalOpacity]
 * @property {Number} [intervalStrokeWidth]
 * @property {Number[]} [dashedLines] horizontal dashed lines
 * @property {(Function | Array)} [xDomain] Function's `this` gives access to properties on the D3Graph instance
 * @property {(Function | Number[])} [yDomain] Function's `this` gives access to properties on the D3Graph instance
 * @property {Boolean} [forecastLine]
 * @property {Function} [yTickFmt]
 * @property {Function} [tooltipPt] Function to return HTML when tooltip is attached to a point.
 * @property {Function} [tooltipXY] Function to return HTML when tooltip is over any part of the graph.
 * @inner
 * @memberof module:@nextstrain/evofr-viz
 */

/**
 * The react component for each individual graph
 * @private
 */
export const Graph = ({modelData, sizes, location, params, options}) => {
  const d3Container = useRef(null);

  /**
   * Add in certain params, as well as interpreting a preset
   */
  const expandedParams = expandParams(params, location);

  useGraph(d3Container, sizes, modelData, expandedParams, options);

  return (
    <D3Container ref={d3Container}/>
  )
}


const tooltipFrequency = displayTopVariants({fmt: d3.format(".1%")});
const tooltipGeneric = displayTopVariants();
const percentageFormat = d3.format(".0%");

function expandParams(providedParams, location) {

  let params = {location};
  switch (providedParams.preset) {
    case undefined:
      // user must define everything!
      // TODO -- check certain params are indeed defined
      // {graphType, key, yDomain, ...} etc
      break;
    case 'frequency':
      params.graphType = "lines"
      params.key = 'freq';
      params.interval  = ['freq_HDI_95_lower', 'freq_HDI_95_upper'];
      params.intervalOpacity = 0.2
      params.tooltipXY = tooltipFrequency;
      params.yDomain = [0, 1]
      params.yTickFmt = percentageFormat;
      params.forecastLine = true;
      break;
    case 'growthAdvantage':
      params.graphType = "points"
      params.key = 'ga';
      params.interval  = ['ga_HDI_95_lower', 'ga_HDI_95_upper'];
      params.tooltipPt = categoryPointTooltip;
      params.yDomain = function() {return this.modelData.get('domains').get('ga');};
      params.xDomain = function() {
        return ['', ...this.modelData.get('variants')]
      }
      params.dashedLines = [1.0]
      break;
    case 'R_t':
      params.graphType = "lines"
      params.key = 'R';
      params.interval  = ['R_HDI_95_lower', 'R_HDI_95_upper'];
      params.intervalOpacity = 0.2
      params.tooltipXY = tooltipGeneric;
      params.yDomain = [0, 3];
      params.dashedLines = [1.0]
      params.annotateFinalPoint = true;
      break;
    case 'stackedIncidence':
      params.graphType = "stream"
      params.key = 'I_smooth';
      params.interval  = ['I_smooth_y0', 'I_smooth_y1'];
      params.intervalStrokeWidth = 0.5;
      params.yDomain = getDomainUsingKey('I_smooth_y1');
      params.tooltipXY = tooltipGeneric;
      break;
    default:
      throw new Error(`Preset ${providedParams.preset} not implemented!`)
  }

  params = {...params, ...providedParams}
  delete params.preset;

  return params;
}

/**
 * Returns a function which will compute the y domain using observed values
 * (dependent on the current location). Currently lower bound is always zero.
 * @private
 */
export function getDomainUsingKey(key) {
  return function() {
    const variants = this.modelData.get('variants');
    const dataPerVariant = this.modelData.get('points').get(this.params.location)
    const maxObserved = d3.max(
      variants.map((v) =>
        d3.max(dataPerVariant.get(v).get('temporal').map((point) => point.get(key)))
      )
    );
    return [0, maxObserved];
  }
}
