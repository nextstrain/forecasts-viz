import {useRef, useEffect, useState} from 'react';
import {isEqual} from './isEqual.js';
import { D3Graph } from "./d3Graph";
import type { D3GraphInstance } from "./d3Graph";
import { GraphParamsWithLocation } from "./graphParams.ts";
import type { Controls } from '../hooks/useControls';

export const useGraph = (dom, sizes, modelData, params: GraphParamsWithLocation, controls: Controls) => {
  const graph = useRef<null|D3GraphInstance>(null);
  const prevDeps = useRef(null);
  // const [emptyGraph, setEmptyGraph] = useState(false);

  useEffect(() => {

    console.log("useGraph::useEffect")
    
    if (!dom.current) {
      console.log("NO DOM?!?!")
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
    console.log("modelDataEqual", modelDataEqual)
    if (!sizesEqual || !modelDataEqual) {
      prevDeps.current.sizes = sizes;
      prevDeps.current.modelData = modelData;
      graph.current = new D3Graph(dom, sizes, modelData, params, controls);
      return;
    }

    // if (graph.current.emptyData === true) {
    //   console.log("EMPPPP")
    //   // setEmptyGraph(true);
    //   return;
    // }
  
    // make d3 aware of new state
    graph.current.controls = controls;
    
    // controls are global, so we ensure they apply to this particular graph as necessary      
    if (
      prevDeps.current.controls.logit !== controls.logit &&
      ['lines', 'statespace'].includes(params.graphType)
    ) {
      graph.current.updateScale()
    }

    // Toggle raw/smoothed points as necessary
    if (params.graphType === 'lines') {
      if (prevDeps.current.controls.rawPoints !== controls.rawPoints) {
        graph.current.togglePoints('raw');
      }
      if (prevDeps.current.controls.smoothedPoints !== controls.smoothedPoints) {
        graph.current.togglePoints('smoothed');
      }
    }
    
    if (prevDeps.current.controls.selectedVariants !== controls.selectedVariants) {
      graph.current.setVariantFocus()
    }
    prevDeps.current.controls = controls;

  }, [dom, sizes, modelData, params, controls]);

  /**
   * TODO - the graph doesn't have to be responsive to window changes _unless_
   * they cross some thresholds. We could get away with a fresh start in such
   * cases.
   */
  
  // return emptyGraph;
}
