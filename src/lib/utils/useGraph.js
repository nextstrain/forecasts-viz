import {useRef, useEffect} from 'react';
import {isEqual} from 'lodash';
import {D3Graph} from "./d3Graph";

export const useGraph = (dom, sizes, modelData, params, options) => {
  const graph = useRef(null);
  const prevDeps = useRef(null);

  useEffect(() => {
    if (!dom.current) {
      return;
    }

    if (!modelData.get('locations').includes(params.location)) {
      console.error(`Location ${params.location} is missing from the model data (for graphType ${params.graphType})`)
      return;
    }

    if (!graph.current) {
      prevDeps.current = {sizes, params, options, modelData};
      graph.current = new D3Graph(dom, sizes, modelData, params, options);
      return;
    }

    /**
     * If any props change for which we don't have the d3 code to nicely update the graph
     * we just recreate it. Because sizes & params are often re-created by parent components
     * we use a deep equality check here to avoid unnecessary renders of the graph.
     * Note that this block runs in dev mode as the modelData changes as react unmounts and
     * remounts every component the first time, but in production this shouldn't run
     * at all with our current design.
     * The model data is compare by reference, however in our intended usage of `useModelData`
     * this reference shouldn't change.
     */
    const sizesEqual = isEqual(prevDeps.current.sizes, sizes);
    const paramsEqual = isEqual(prevDeps.current.params, params);
    const modelDataEqual = prevDeps.current.modelData === modelData;
    if (!sizesEqual || !paramsEqual || !modelDataEqual) {
      // NOTE: following logging is useful to debug why the hook is running
      // console.log(`Recreating graph because these props changed: ${sizesEqual ? '' : 'sizes'} ${paramsEqual ? '' : 'params'} ${modelDataEqual ? '' : 'modelData'}`);
      prevDeps.current.sizes = sizes;
      prevDeps.current.params = params;
      prevDeps.current.modelData = modelData;
      graph.current = new D3Graph(dom, sizes, modelData, params, options);
      return;
    }
    /**
     * Changes in options (currently only the logit toggle) have an associated
     * update function. In the future this could include hovering over a variant
     * in the legend & highlighting that (for example).
     */

    if (!isEqual(prevDeps.current.options, options)) {
      console.log("Updating graph as options have changed");
      if (!isEqual(prevDeps.current.options.logit, options.logit)) {
        console.log("\tLOGIT")
        graph.current.updateScale(options)
      }
      prevDeps.current.options = options;
    }

  }, [dom, sizes, modelData, params, options]);

  /**
   * TODO - the graph doesn't have to be responsive to window changes _unless_
   * they cross some thresholds. We could get away with a fresh start in such
   * cases.
   */
}
