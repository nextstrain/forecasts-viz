import React, {useEffect, useRef} from 'react';
import styled from 'styled-components';
import * as d3 from "d3";


/**
 * My original intention for the legend on wide-screens was to have it stay in a
 * fixed position on the RHS and not allow it to scroll off the screen. With a
 * single <Legend> this can easily be achieved with `position: fixed` however
 * things get tricky with multiple legends. I chose to have one legend per panel
 * (set of small-multiples) as I want to enable interactivity between the legend
 * and the corresponding panel, and to allow panels with different legends.
 *                                                                james, jan 2023
 * @private
*/

const LegendContainer = styled.div`
  /* border: solid red; */
  display: flex;

  /* legend-inline styles (which will be overridden by a media query if necessary) */
  position: block;
  flex-wrap: wrap;
  flex-direction: row;
  margin: 10px 0px;
  & > div {
    padding-right: 10px;
  }

  @media screen and (min-width: ${(props) => props.thresholdWidth}px) {
    position: absolute;
    right: 0px;
    max-width: 200px;
    min-width: 200px;
    flex-wrap: nowrap;
    flex-direction: column;
    & > div {
      padding-right: 0px;
    }
  }
`;

const useLegend = (d3Container, modelData) => {
  useEffect(() => {
    /* legend entries are arranged via the parent container's flexbox settings */

    const dom = d3.select(d3Container.current);
    dom.selectAll("*").remove();

    const containers = dom.selectAll("legendContainers")
      .data(modelData.get('variants'))
      .enter().append("div")
        .style("display", "flex")
        .style("align-items", "center") // legend swatches vertically centered with legend text

    containers.append("svg")
      .attr("width", 30)
      .attr("height", 30)
      .attr("viewBox", `0 0 30 30`)
      .append("circle")
        .attr("cx", 15)
        .attr("cy", 15)
        .attr("r", 8)
        .style("fill", (variant) => modelData.get('variantColors').get(variant) ||  modelData.get('variantColors').get('other'))
    
    containers.append("p")
      .text((variant) => modelData.get('variantDisplayNames').get(variant) || variant)

  }, [d3Container, modelData])
}

export const Legend = ({modelData, thresholdWidth}) => {
  const legendContainer = useRef(null);
  useLegend(legendContainer, modelData); // renders the legend
  return (
    <LegendContainer id="legend" ref={legendContainer} thresholdWidth={thresholdWidth}/>
  );
}
