import React, {useEffect, useRef} from 'react';
import * as d3 from "d3";
import { useControlsContext } from '../hooks/ControlsContext';
import { ChangeVariant } from '../hooks/useControls';
import { ModelData } from "../utils/modelData.types.ts";

interface LegendProps {
  modelData: ModelData;
  sizes: any; // todo
  preset: string;
}

const useLegend = (d3Container: React.RefObject<HTMLDivElement | null>, modelData: ModelData, sizes: any, selectedVariants: Set<string>, changeVariant: ChangeVariant, preset: string) => {
  useEffect(() => {
    /* legend entries are arranged via the parent container's flexbox settings */

    let variants = modelData.get('variants')

    const dom = d3.select(d3Container.current);
    dom.selectAll("*").remove();

    const containers = dom.selectAll("legendContainers")
      .data(variants)
      .enter().append("div")
      .style("display", "flex")
      .style("align-items", "center") // legend swatches vertically centered with legend text
      .style("cursor", "pointer")
      .on("click", (event, variant) => {
        if (event.shiftKey) {
          if (!selectedVariants.has(variant)) {
            changeVariant(variant, 'append');
          } else {
            changeVariant(variant, 'unset');
          }
        } else {
          // Clicking on an unselected variant -> that becomes the only one selected
          // Clicking on a selected variant if there's multiple selected -> that becomes the only one selected
          if (!selectedVariants.has(variant) || selectedVariants.size > 1) {
            changeVariant(variant, 'set');
          } else {
            changeVariant(variant, 'unset');
          }
        }
      });

    const hasSelection = selectedVariants.size > 0;
    const strokeWidth = 2;
    const variantColor = (variant) => modelData.get('variantColors').get(variant) || modelData.get('variantColors').get('other');
    const isFilled = (variant) => !hasSelection || selectedVariants.has(variant);

    containers.append("svg")
      .style("flex-shrink", "0")
      .attr("width", sizes.legendRadius*2)
      .attr("height", sizes.legendRadius*2)
      .attr("viewBox", `0 0 ${sizes.legendRadius*2} ${sizes.legendRadius*2}`)
      .append("circle")
        .attr("cx", sizes.legendRadius)
        .attr("cy", sizes.legendRadius)
        .attr("r", (variant) => isFilled(variant) ? sizes.legendRadius : sizes.legendRadius - strokeWidth/2)
        .style("fill", (variant) => isFilled(variant) ? variantColor(variant) : "none")
        .style("stroke", (variant) => isFilled(variant) ? "none" : variantColor(variant))
        .style("stroke-width", (variant) => isFilled(variant) ? 0 : strokeWidth)

    containers.append("span")
      .text((variant) => modelData.get('variantDisplayNames').get(variant) || variant)

  }, [d3Container, sizes, modelData, selectedVariants, changeVariant, preset])
}

export const Legend = ({modelData, sizes, preset}: LegendProps) => {
  const legendContainer = useRef(null);
  const {changeVariant, selectedVariants} = useControlsContext();
  useLegend(legendContainer, modelData, sizes, selectedVariants, changeVariant, preset); // renders the legend
  return (
    <div className="legend" ref={legendContainer}/>
  );
}
