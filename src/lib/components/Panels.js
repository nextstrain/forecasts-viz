import React from 'react';
import styled from 'styled-components';
import { SmallMultiple } from "./SmallMultiple";
import { Legend, WINDOW_WIDTH_FOR_SIDEBAR_LEGEND } from "./Legend";
import { ErrorBoundary } from './ErrorBoundary';
import { useModelData } from "./ModelDataProvider";


/**
 * The intention is to (eventually) expose two components here
 * which display a panel of graphs (or perhaps one component
 * parameterised by props). The first will display the same graph
 * type, for multiple locations. The second will display multiple
 * graph types for the same location.
 * @private
 */


/** Container has 2 children: the legend and the container of the small-multiples  */
const Container = styled.div`
  /* border: dashed orange; */
  display: flex;
  flex-wrap: nowrap;
  flex-direction: column;
  @media screen and (min-width: ${WINDOW_WIDTH_FOR_SIDEBAR_LEGEND}px) {
    flex-direction: row-reverse;
  }
`;

const PanelSectionContainer = styled.div`
  /* border: dashed purple; */
  display: flex;
  flex-wrap: wrap;
  /* For full rows I wanted even spacing L-R, which is accomplished by
  justify-content: space-between. However this has the unfortunate side effect
  of introducing a large hole in the final row. */
  justify-content: flex-start;
  @media screen and (min-width: ${WINDOW_WIDTH_FOR_SIDEBAR_LEGEND}px) {
    flex-direction: row-reverse;
    justify-content: space-evenly;
  }
`;


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
 * This component must be a descendent of a `<ModelDataProvider>`
 * @param {('growthAdvantage'|'r_t'|'frequency'|'stackedIncidence')} graphType
 * @param {(Array|undefined)} locations Defaults to `undefined` which will display all available locations
 * @kind React Component
 * @memberof module:@nextstrain/evofr-viz
 * @category Components
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
  graphType,
  facetStyles={},
  locations=undefined, /* optional. Defaults to all available */
}) => {
  const sizes = {...useResponsiveSizing(graphType), ...facetStyles};
  const {modelData} = useModelData();

  /**
   * The loading status and/or errors (available via `useModelData()`) are intended to be
   * used by the <ModelDataStatus> component, or similar. For panel rendering we simply wait
   * until the modelData is available. Improvements (loading spinners etc) are possible.
   */ 
  if (!modelData) {
    return null;
  }
  const locationList = locations || modelData.get('locations');
  return (
    <Container>
      <Legend modelData={modelData}/>
      <PanelSectionContainer>
        {locationList
          .map((location) => ({location, graph: graphType, sizes}))
          .map((param) => (
            <SmallMultiple {...param} key={`${param.graph}_${param.location}`} modelData={modelData}/>
            ))
          }
      </PanelSectionContainer>
    </Container>
  )
}

