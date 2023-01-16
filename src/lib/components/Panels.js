import React from 'react';
import styled from 'styled-components';
import { SmallMultiple } from "./SmallMultiple";
import { Legend } from "./Legend";
import { ErrorBoundary } from './ErrorBoundary';
import { useModelData } from "./ModelDataProvider";

/**
 * The intention is to (eventually) expose two components here
 * which display a panel of graphs (or perhaps one component
 * parameterised by props). The first will display the same graph
 * type, for multiple locations. The second will display multiple
 * graph types for the same location.
 */


const WINDOW_WIDTH_FOR_SIDEBAR_LEGEND = 1200;

const Container = styled.div`
  /* border: dashed orange; */
  @media screen and (min-width: ${WINDOW_WIDTH_FOR_SIDEBAR_LEGEND}px) {
    margin-right: 100px; // + the 100px from <App> Container
  }
`;

const PanelSectionContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const useResponsiveSizing = () => {
  /* following are in pixel coordinates */
  const width = 250;
  const height = 200;
  /* control the spacing around graphs via the margin of each graph */
  const margin = {top: 5, right: 20, bottom: 40, left: 40}
  const fontSize = "10px";

  return {width, height, margin, fontSize};
}

/**
 * Main logic placed within <Panel> so that if any hooks have errors they
 * bubble up to this component
 */
export const PanelDisplay = (props) => {
  return (
    <ErrorBoundary>
      <Panel {...props}/>
    </ErrorBoundary>
  )
}

export const Panel = ({
  graphType,
  locations=undefined, /* optional. Defaults to all available */
}) => {
  const sizes = useResponsiveSizing();
  const {modelData} = useModelData();
  const locationList = locations || modelData.get('locations');
  return (
    <Container>
      <Legend modelData={modelData} thresholdWidth={WINDOW_WIDTH_FOR_SIDEBAR_LEGEND}/>
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

