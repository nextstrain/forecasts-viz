import React, { useState } from 'react';
import { useElementSize, useDebounce } from 'usehooks-ts';
import styled from 'styled-components';
import { Legend } from "./Legend";
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorMessage } from "./ErrorMessage";
import Spinner from "./Spinner";
import { Toggle } from "./Toggle";
import { Graph } from "./Graph";
import "../styles/styles.css";

/**
 * The intention is to (eventually) expose two components here
 * which display a panel of graphs (or perhaps one component
 * parameterised by props). The first will display the same graph
 * type, for multiple locations. The second will display multiple
 * graph types for the same location.
 * @private
 */


/**
 * <Container> is intended to have 2 children: <Legend> and <PanelSectionContainer>
 * The intention is for both to occupy the full width and the Legend
 * to be on top.
 * @private 
 */
const Container = styled.div`
  /* border: dashed orange; */
  display: flex;
  flex-wrap: nowrap;
  flex-direction: column;
`;

/**
 * Container for the individual <Graph> elements
 * @private 
 */
const PanelSectionContainer = styled.div`
  /* border: dashed purple; */
  flex-grow: 1;
  display: grid;
  gap: 0px;
  padding-top: 10px;
  grid-template-columns: repeat(auto-fill, minmax(${props => props.smallMultipleWidth}px, 1fr));
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: flex-end;
`

/**
 * This function should handle all styling parameters related to sizing -- graph sizes,
 * legend sizes, text sizes etc. It is a work in progress. All styles defined here can be
 * overridden by props from the parent component.
 * @private 
 */
const responsiveSizing = (params, modelData, dimensions, locationList) => {

  const outerWidth = dimensions.width;

  const numVariants = modelData?.get('variants')?.length;

  let legendFontSize = 15;
  let legendRadius = 8;

  /** width/heights are in pixels (as they'll be used in the SVG).
   * We try to make some sensible decisions about these widths
   * depending on the data & window sizes
   */
  let width = 260;
  let height = params.preset==="growthAdvantage" ? 230 : 210;
  if (numVariants > 20) {
    height = 300;
    width = 500;
    legendFontSize = 11;
    legendRadius = 6;
  }

  /* If there's only 1 or 2 locations make each full width */
  if (locationList?.length<3) {
    width = outerWidth - 20 // outer div allowing for some margin
  }

  /* If growthAdvantage and lineages, always use full width */
  if (params.preset==="growthAdvantage" && numVariants > 20) {
    width = outerWidth - 20 // outer div allowing for some margin
  }

  /* control the spacing around graphs via the margin of each graph
  We export these as individual keys so they can be easily overridden.
  The initial ones are generally ok. */
  let [top, right, bottom, left] = [15, 10, 30, 45];
  if (params.preset==="growthAdvantage") {
    [top, right, bottom, left] = [15, 40, 70, 40];
  }

  return {
    width, height,
    top, right, bottom, left,
    legendFontSize, legendRadius,
    outerWidth
  };
}


/**
 * @typedef {Object} SmallMultipleStyles
 * Configuration for dimensions & styles of a small-multiple graph.
 * These override hardcoded (sensible) defaults.
 * More properties to come...
 * @property {Number} [width] width of SVG (pixels)
 * @property {Number} [height] height of SVG (pixels)
 * @property {Number} [top] margin of graph (pixels)
 * @property {Number} [right] margin of graph (pixels)
 * @property {Number} [bottom] margin of graph (pixels)
 * @property {Number} [left] margin of graph (pixels)
 * @private
 */

/**
 * Display a panel of small-multiple graphs for different locations.
 * This component should be provided data obtained via the `useModelData` hook.
 * The `params` prop defines the graphs to be drawn.
 * The `styles` prop defines any style overrides to the graphs.
 * The `locations` prop allows you to define a subset of locations for which to draw graphs.
 * @param {ModelDataWrapper} data see `useModelData`
 * @param {GraphParameters} params
 * @param {SmallMultipleStyles} styles
 * @param {(Array|undefined)} locations default (`undefined`) displays all available locations
 * @kind React Component
 * @memberof module:@nextstrain/evofr-viz
 * @example
 * // typical usage is to use a preset graph type
 * <PanelDisplay data={...} params={{preset: "frequency"}}/>
 * @example
 * // an example of defining the params yourself
 * // this will create a temporal line graph using the `I_smooth` key
 * <PanelDisplay data={...} params={{
 *   graphType: "lines",
 *   key: 'I_smooth',
 *   interval:  ['I_smooth_HDI_95_lower', 'I_smooth_HDI_95_upper'],
 *   intervalOpacity: 0.3,
 *   yDomain: getDomainUsingKey('I_smooth_HDI_95_upper'),
 *   tooltipXY: displayTopVariants(),
 * }}/>
 * @example
 * // custom styling can be provided which is applied to each small-multiple
 * <PanelDisplay data={...}
 *    styles={{height: 300, width: 400}}
 *    params={{preset: "stackedIncidence"}}
 * /> 
 */
export const PanelDisplay = (props) => {
  return (
    <ErrorBoundary>
      <Panel {...props}/>
    </ErrorBoundary>
  )
}

/**
 * See <PanelDisplay> for description. That component wraps this one
 * so that if any hooks have errors they bubble up and can be caught
 * @private 
 */
const Panel = ({
  data,
  params,
  styles=undefined,
  locations=undefined, /* optional. Defaults to all available */
}) => {
  const {modelData, error} = data;
  const [logit, toggleLogit] = useState(false);
  const [showDailyRawFreq, toggleShowDailyRawFreq] = useState(false);
  const [showWeeklyRawFreq, toggleShowWeeklyRawFreq] = useState(false);
  const [legendSwatchHovered, setLegendSwatchHovered] = useState(undefined);

  const [outerDivRef, _dimensions] = useElementSize()
  const dimensions = useDebounce(_dimensions, 500);
  const  locationList = locations || modelData?.get('locations');
  const sizes = {...responsiveSizing(params, modelData, dimensions, locationList), ...(styles ? styles : {})};
  const canUseLogit = params.canUseLogit || params.preset==="frequency";
  const canShowDailyRawFreq = params.preset==='frequency' && modelData && modelData?.get('sites')?.has('daily_raw_freq');
  const canShowWeeklyRawFreq = params.preset==='frequency' && modelData && modelData?.get('sites')?.has('weekly_raw_freq');

  if (error) {
    return (<ErrorMessage error={error}/>);
  }

  if (!modelData) {
    return <Spinner/>
  }

  return (
    <div ref={outerDivRef}>
      <OptionsContainer>
        {canUseLogit && <Toggle label="Logit transform" checked={logit} sizes={sizes} onChange={() => toggleLogit(!logit)}/>}
        {canShowDailyRawFreq && <Toggle label="Daily raw data" checked={showDailyRawFreq} sizes={sizes} onChange={() => toggleShowDailyRawFreq(!showDailyRawFreq)}/>}
        {canShowWeeklyRawFreq && <Toggle label="Weekly raw data" checked={showWeeklyRawFreq} sizes={sizes} onChange={() => toggleShowWeeklyRawFreq(!showWeeklyRawFreq)}/>}
      </OptionsContainer>

      <Container>
        <Legend modelData={modelData} sizes={sizes} setLegendSwatchHovered={setLegendSwatchHovered} preset={params.preset}/>
        <PanelSectionContainer smallMultipleWidth={sizes.width}>
          {locationList
            .map((location) => (
              <Graph
                modelData={modelData}
                sizes={sizes}
                location={location}
                params={params}
                options={{logit, showDailyRawFreq, showWeeklyRawFreq, legendSwatchHovered}}
                key={`${params.preset || params.key}_${location}`}
              />
            ))
          }
        </PanelSectionContainer>
      </Container>
    </div>
  )
}
