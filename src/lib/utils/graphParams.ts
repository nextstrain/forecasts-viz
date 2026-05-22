import { displayTopVariants, categoryPointTooltip } from "./tooltipDisplay";
import type { D3GraphInstance } from "./d3Graph";
import * as d3 from "d3";


export type UserGraphParams = Partial<GraphParams> & { preset: string };

export type GraphParamsWithLocation = GraphParams & { location: string };

export interface GraphParams {
  preset: string;
  graphType: "lines" | "points" | "statespace";
  key: string;
  interval: [string, string];
  canUseLogit: boolean;
  showRawPoints: boolean;
  showSmoothedPoints: boolean;
  intervalOpacity?: number;
  intervalStrokeWidth?: number;
  /** Why are their two tooltip properties?!?! */
  tooltipXY?: any;
  tooltipPt?: any;
  /**
   * The domains should be in the `parse` code - they're more related to the _data_ than
   * how we should visualize it. Unless viz wants to focus in on things? TODO XXX
   */
  yDomain: [number, number] | ((this: D3GraphInstance) => [number, number]);
  xDomain?: () => any;
  yTickFmt?: (n: number | { valueOf(): number }) => string;
  dashedLines?: number[];
  forecastLine?: boolean;
  annotateFinalPoint?: boolean;
  [key: string]: any;
}

const tooltipFrequency = displayTopVariants({fmt: d3.format(".1%")});
const percentageFormat = d3.format(".0%");

export function expandParams(providedParams: UserGraphParams): GraphParams {

  let params: Record<string, any> = {location}; // todo
  switch (providedParams.preset) {
    case undefined:
      throw new Error("Graph params must define a preset!")
    case 'frequency':
      params.graphType = "lines"
      params.key = 'freq';
      params.canUseLogit = true;
      params.showRawPoints = true;
      params.showSmoothedPoints = true;
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
      params.yDomain = function(this: D3GraphInstance) {return this.modelData.get('domains').ga;};
      params.xDomain = function(this: D3GraphInstance) {
        return ['', ...this.modelData.get('variants')]
      }
      params.dashedLines = [1.0]
      break;
    case 'relativeGA':
      params.graphType = "lines"
      params.key = 'relativeGA';
      params.forecastLine = true;
      params.yDomain = function (this: D3GraphInstance) { return this.modelData.get('domains').relativeGa; };
      // params.tooltipXY = tooltipGeneric; // TODO XXX
      break;

    case 'meanPopFitness':
      params.graphType = "lines"
      params.key = 'meanPopFitness';
      params.forecastLine = true;
      params.yDomain = function (this: D3GraphInstance) {
        let [low, high]: [number, number] = [Infinity, -Infinity];
        for (const meanPopFitnessData of Object.values(this.modelData.get('points').meanPopFitness)) {
          if (meanPopFitnessData.lower < low) low = meanPopFitnessData.lower;
          if (meanPopFitnessData.upper > high) high = meanPopFitnessData.upper;
        }
        const delta = high - low;
        return [low - 0.1*delta, high+0.1*delta];
      };
      // params.tooltipXY = tooltipGeneric; // TODO XXX
      break;
    case 'relativeFitness':
      params.graphType = "lines"
      params.key = 'relativeFitness';
      params.forecastLine = true;
      params.yDomain = function (this: D3GraphInstance) {
        const bounds = this.modelData.get('domains').relativeFitness;
        const delta = bounds[1] - bounds[0]; // this is in log space, so not quite right but good enough
        return [bounds[0] - delta * 0.1, bounds[1] + delta * 0.1];
      };
      // params.tooltipXY = tooltipGeneric; // TODO XXX
      break;
    case 'relativeFitnessVsFrequency':
      params.graphType = "statespace"
      params.key = 'relativeFitness';
      params.forecastLine = true;
      params.annotateFinalPoint = true;
      params.canUseLogit = true;
      params.yDomain = function (this: D3GraphInstance) {
        const bounds = this.modelData.get('domains').relativeFitness;
        const delta = bounds[1] - bounds[0]; // this is in log space, so not quite right but good enough
        return [bounds[0] - delta * 0.1, bounds[1] + delta * 0.1];
      };
      // params.tooltipXY = tooltipGeneric; // TODO XXX
      break;
    default:
      throw new Error(`Preset ${providedParams.preset} not implemented!`)
  }

  const defaults = {
    canUseLogit: false,
    showRawPoints: false,
    showSmoothedPoints: false,
  }
  
  params = {...defaults, ...params, ...providedParams}

  return params as GraphParams; // TODO: fix types
}



export function getDomainUsingKey(key: string) {
  return function(this: D3GraphInstance): [number, number] { // todo: type D3Graph instance
    const variants = this.modelData.get('variants');
    const locationData = this.modelData.get('points')[this.params.key]?.[this.params.location];
    const maxObserved = Number(d3.max(
      variants.map((v) =>
        d3.max(locationData?.[v]?.temporal?.map((point: any) => point?.[key]))
      )
    ));
    return [0, maxObserved];
  }
}
