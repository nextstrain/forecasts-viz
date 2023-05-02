import {useRef, useEffect} from 'react';
import {D3Graph} from "./d3Graph";

export const useGraph = (dom, sizes, modelData, params, options) => {
  const graph = useRef(null);
  /* we store (references to) previous props to be able to
  know which partial update (in d3-land) to perform */
  const startFreshProps = useRef({});
  const updateProps = useRef({});
    
  useEffect(() => {
    if (!dom.current) {
      return;
    }

    if (!modelData.get('locations').includes(params.location)) {
      console.error(`Location ${params.location} is missing from the model data (for graphType ${params.graphType})`)
      return;
    }

    function startFresh() {
      /* Any changes in the following props result in the graph being
      removed & regenerated, as we don't code in the update logic */
      startFreshProps.current.modelData = modelData;
      startFreshProps.current.params = params;
      startFreshProps.current.sizes = sizes;
      /* The following options, if changed, will update the graph */
      updateProps.current.logit = options.logit;
      graph.current = new D3Graph(dom, sizes, modelData, params, options);
    }

    if (!graph.current) {
      startFresh();
      return;
    }
    /**
     * If any props change for which we don't have the d3 code to nicely update the graph
     * we just recreate it.
     * Note that this block runs in dev mode as the modelData changes as react unmounts and
     * remounts every component the first time, but in production this shouldn't run
     * at all with our current design.
     */
    if (
      modelData!==startFreshProps.current.modelData ||
      params!==startFreshProps.current.params ||
      sizes!==startFreshProps.current.sizes
    ) {
      // NOTE: following logging is useful for development why the hook is running
      // const whatChanged = [];
      // if (startFreshProps.current.modelData!==modelData) whatChanged.push('modelData')
      // if (startFreshProps.current.params!==params) whatChanged.push('params')
      // if (startFreshProps.current.sizes!==sizes) whatChanged.push('sizes')
      // console.log(`Recreating graph because these props changed: ${whatChanged.join(', ')}`);
      startFresh();
      return;
    }
    /**
     * Changes in options (currently only the logit toggle) have an associated
     * update function. In the future this could include hovering over a variant
     * in the legend & highlighting that (for example).
     */
    if (options.logit!==updateProps.current.logit) {
      updateProps.current.logit = options.logit;
      graph.current.updateScale(options)
    }
  }, [dom, sizes, modelData, params, options]);

  /**
   * TODO - the graph doesn't have to be responsive to window changes _unless_
   * they cross some thresholds. We could get away with a fresh start in such
   * cases.
   */
}
