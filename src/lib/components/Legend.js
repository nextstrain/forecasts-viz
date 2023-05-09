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
  min-width: ${(props) => props.sizes.legendMinWidthRHS}px;
  text-align: left;
  position: block;
  flex-wrap: wrap;
  flex-direction: row;
  margin: 10px 0px;
  font-size: ${props => props.sizes.legendFontSize}px;

  & > div { /* container for circle + text */
    padding-right: 10px;
    padding-top: 0px 
  }
  & span { /* text */
    margin-left: 3px;
  }

  @media screen and (min-width: ${(props) => props.sizes.legendBreakpoint}px) {
    max-width: ${(props) => props.sizes.legendMinWidthRHS}px;
    flex-wrap: nowrap;
    flex-direction: column;
    justify-content: space-between;

    /* TODO XXX */
    max-height: 400px; /* temporary -- in lieu of responsive styling */
    overflow-y: scroll; /* temporary -- in lieu of responsive styling */

    & > div { /* container for circle + text */
      padding-right: 0px;
    }
    & span { /* text */
      margin-left: 5px;
    }
  }
`;

const useLegend = (d3Container, modelData, sizes) => {
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
      .style("flex-shrink", "0")
      .attr("width", sizes.legendRadius*2)
      .attr("height", sizes.legendRadius*2)
      .attr("viewBox", `0 0 ${sizes.legendRadius*2} ${sizes.legendRadius*2}`)
      .append("circle")
        .attr("cx", sizes.legendRadius)
        .attr("cy", sizes.legendRadius)
        .attr("r", sizes.legendRadius)
        .style("fill", (variant) => modelData.get('variantColors').get(variant) ||  modelData.get('variantColors').get('other'))
    
    containers.append("span")
      .text((variant) => modelData.get('variantDisplayNames').get(variant) || variant)

  }, [d3Container, sizes, modelData])
}

export const Legend = ({modelData, sizes}) => {
  const legendContainer = useRef(null);
  useLegend(legendContainer, modelData, sizes); // renders the legend
  return (
    <LegendContainer sizes={sizes} id="legend" ref={legendContainer}/>
  );
}
