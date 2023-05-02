import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Legend, WINDOW_WIDTH_FOR_SIDEBAR_LEGEND } from "./Legend";
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
 * Container has 2 children: the legend and the container of the small-multiples
 * @private 
 */
const Container = styled.div`
  /* border: dashed orange; */
  display: flex;
  flex-wrap: nowrap;
  flex-direction: column;
  @media screen and (min-width: ${WINDOW_WIDTH_FOR_SIDEBAR_LEGEND}px) {
    flex-direction: row-reverse;
  }
`;

/**
 * @private 
 */
const PanelSectionContainer = styled.div`
  /* border: dashed purple; */
  flex-grow: 1;
  display: grid;
  gap: 20px;
  padding-top: 10px;
  grid-template-columns: repeat(auto-fill, minmax(${props => props.smallMultipleWidth}px, 1fr));
`;

/**
 * @private 
 */
const responsiveSizing = (params) => {
  /* following are in pixel coordinates */
  const width = 250;
  let height = 200;
  /* control the spacing around graphs via the margin of each graph
  We export these as individual keys so they can be easily overridden.
  The initial ones are generally ok. */
  let [top, right, bottom, left] = [5, 0, 20, 35];
  if (params.preset==="growthAdvantage") {
    [top, right, bottom, left] = [5, 30, 60, 30];
    height = 220;
  }
  return {width, height, top, right, bottom, left};
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
  const sizes = useMemo(
    () => ({...responsiveSizing(params), ...(styles ? styles : {})}),
    [params, styles]
  );
  const canUseLogit = useMemo(
    () => (params.canUseLogit || params.preset==="frequency"),
    [params]
  )

  if (error) {
    return (<ErrorMessage error={error}/>);
  }

  if (!modelData) {
    return <Spinner/>
  }

  const locationList = locations || modelData.get('locations');

  return (
    <div>
      {canUseLogit && <Toggle label="Logit transform" checked={logit} onChange={() => toggleLogit(!logit)}/>}
      <Container>
        <Legend modelData={modelData}/>
        <PanelSectionContainer smallMultipleWidth={sizes.width}>
          {locationList
            .map((location) => (
              <Graph
                modelData={modelData}
                sizes={sizes}
                location={location}
                params={params}
                options={{logit}}
                key={`${params.preset || params.key}_${location}`}
              />
            ))
          }
        </PanelSectionContainer>
      </Container>
    </div>
  )
}
