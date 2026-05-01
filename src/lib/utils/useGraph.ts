import {useRef, useEffect, useState} from 'react';
import {isEqual} from './isEqual.js';
import {D3Graph} from "./d3Graph";

export const useGraph = (dom, sizes, modelData, params, controls) => {
  const graph = useRef(null);
  const prevDeps = useRef(null);
  const [emptyGraph, setEmptyGraph] = useState(false);

  useEffect(() => {
    if (!dom.current) {
      return;
    }

    if (!modelData.get('locations').includes(params.location)) {
      console.error(`Location ${params.location} is missing from the model data (for graphType ${params.graphType})`)
      return;
    }

    if (!graph.current) {
      prevDeps.current = {sizes, controls, modelData};
      graph.current = new D3Graph(dom, sizes, modelData, params, controls);
      return;
    }

    const sizesEqual = isEqual(prevDeps.current.sizes, sizes);
    const modelDataEqual = prevDeps.current.modelData === modelData;
    if (!sizesEqual || !modelDataEqual) {
      prevDeps.current.sizes = sizes;
      prevDeps.current.modelData = modelData;
      graph.current = new D3Graph(dom, sizes, modelData, params, controls);
      return;
    }

    if (graph.current.emptyData===true) {
      setEmptyGraph(true);
      return;
    }
  
    // controls are global, so we ensure they apply to this particular graph as necessary      
    if (params.graphType==='lines' && prevDeps.current.controls.logit !== controls.logit) {
      graph.current.updateScale(controls)
    }
    if (params.graphType==='lines' && prevDeps.current.controls.showDailyRawFreq !== controls.showDailyRawFreq) {
      graph.current.togglePoints(controls, 'raw')
    }
    if (params.graphType==='lines' && prevDeps.current.controls.showWeeklyRawFreq !== controls.showWeeklyRawFreq) {
      graph.current.togglePoints(controls, 'smoothed')
    }
    if (prevDeps.current.controls.selectedVariants !== controls.selectedVariants) {
      graph.current.setVariantFocus(controls.selectedVariants)
    }
    prevDeps.current.controls = controls;

  }, [dom, sizes, modelData, params, controls]);

  /**
   * TODO - the graph doesn't have to be responsive to window changes _unless_
   * they cross some thresholds. We could get away with a fresh start in such
   * cases.
   */
  
  return emptyGraph;
}
