import React, { useState } from 'react';
import styled from 'styled-components';
import { SmallMultiple, canUseLogit } from "./SmallMultiple";
import { Legend, WINDOW_WIDTH_FOR_SIDEBAR_LEGEND } from "./Legend";
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorMessage } from "./ErrorMessage";
import Spinner from "./Spinner";
import { Toggle } from "./Toggle";
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
const useResponsiveSizing = (graphType) => {
  /* following are in pixel coordinates */
  const width = 250;
  let height = 200;
  /* control the spacing around graphs via the margin of each graph
  We export these as individual keys so they can be easily overridden.
  The initial ones are generally ok. */
  let [top, right, bottom, left] = [5, 0, 20, 35];
  if (graphType==="growthAdvantage") {
    [top, right, bottom, left] = [5, 30, 60, 30];
    height = 220;
  }
  return {width, height, top, right, bottom, left};
}

/**
 * Display a panel of small-multiple graphs for different locations.
 * This component must be provided data obtained via the `useModelData` hook
 * @param {ModelDataWrapper} data
 * @param {('growthAdvantage'|'R'|'frequency'|'stackedIncidence')} graphType
 * @param {(Array|undefined)} locations Defaults to `undefined` which will display all available locations
 * @kind React Component
 * @memberof module:@nextstrain/evofr-viz
 * @example
 * <PanelDisplay graphType="ga"/>
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
  graphType,
  facetStyles={},
  locations=undefined, /* optional. Defaults to all available */
}) => {
  const {modelData, error} = data;
  const [logit, toggleLogit] = useState(false);
  const sizes = {...useResponsiveSizing(graphType), ...facetStyles};

  if (error) {
    return (<ErrorMessage error={error}/>);
  }

  if (!modelData) {
    return <Spinner/>
  }

  const locationList = locations || modelData.get('locations');

  return (
    <div>
      {canUseLogit.has(graphType) && <Toggle label="Logit transform" checked={logit} onChange={() => toggleLogit(!logit)}/>}
      <Container>
        <Legend modelData={modelData}/>
        <PanelSectionContainer smallMultipleWidth={sizes.width}>
          {locationList
            .map((location) => ({location, graph: graphType, sizes}))
            .map((param) => (
              <SmallMultiple {...param} key={`${param.graph}_${param.location}`} modelData={modelData} logit={logit}/>
              ))
            }
        </PanelSectionContainer>
      </Container>
    </div>
  )
}

