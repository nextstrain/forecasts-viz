import React, { useRef } from 'react';
import { useGraph } from "../utils/useGraph";
import { useControlsContext } from "../hooks/ControlsContext";
import { displayTopVariants, categoryPointTooltip } from "../utils/tooltipDisplay";
import { ModelData } from "../utils/modelData.types.ts";
import * as d3 from "d3";

interface GraphProps {
  modelData: ModelData;
  sizes: any; // todo
  location: string;
  params: any; // todo
}

export const Graph = ({modelData, sizes, location, params}: GraphProps) => {
  const d3Container = useRef(null);
  const controls = useControlsContext();

  const expandedParams = expandParams(params, location);
  
  const emptyGraph = useGraph(d3Container, sizes, modelData, expandedParams, controls);  
  
  if (emptyGraph) return null;

  return (
    <div ref={d3Container}/>
  )
}


const tooltipFrequency = displayTopVariants({fmt: d3.format(".1%")});
const tooltipGeneric = displayTopVariants();
const percentageFormat = d3.format(".0%");

function expandParams(providedParams: any, location: string) { // todo: type providedParams

  let params: Record<string, any> = {location}; // todo
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

export function getDomainUsingKey(key: string) {
  return function(this: any) { // todo: type D3Graph instance
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
