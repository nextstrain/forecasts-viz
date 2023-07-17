import {useState, useEffect} from 'react';
import {parseModelData} from "./parse.js";


/**
 * @typedef {Object} ModelDataWrapper
 * @property {(ModelData|undefined)} modelData
 * @property {(String|undefined)} error Errors encountered during JSON fetch / parse
 * @inner
 * @memberof module:@nextstrain/evofr-viz
 */

/**
 * @typedef {Object} DatasetConfig
 * Configuration for the datasets to fetch & parse
 * Currently the library is only built for `forecasts-ncov` model data
 * and so there are hardcoded expectations. These will be lifted up and
 * made config-options so that this library is pathogen agnostic.
 *
 * @property {string} modelName Name of the model - used to improve clarity of error messages
 * @property {string} modelUrl Address to fetch the model JSON from 
 * @property {Set} [sites] list of sites to extract from JSON.
 *                         If not provided we will use the sites set in the JSON metadata.
 * @property {Map<string,string>} [variantColors] colors for the variants specified in the model JSONs.
 *                                                A default colour scale is available.
 * @property {Map<string,string>} [variantDisplayNames] display names for the variants specified in the model JSONs. 
 *                                                      If not provided we use the keys as names.
 * @inner
 * @memberof module:@nextstrain/evofr-viz
 */


/**
 * Fetch and parse the model data (JSON).
 * See the `config` type definition to understand the expected options.
 * This returns an object containing the modelData (type: `modelData`) and
 * any error messages. If an error is encountered we also print this to the
 * console (`console.error()`).
 * The return value is designed to be passed to a <PanelDisplay> component's
 * as its `data` prop.
 * 
 * Warning: Ensure the config object is not (re-)created within your react
 * component, as this will trigger a re-fetch of the data and subsequent
 * re-rendering of the graphs.
 * @param {DatasetConfig} config 
 * @returns {ModelDataWrapper}
 * @memberof module:@nextstrain/evofr-viz
 * @example
 * const mlrData = useModelData(
 *   modelName: "MLR",
 *   modelUrl: "https://nextstrain-data.s3.amazonaws.com/files/workflows/forecasts-ncov/gisaid/nextstrain_clades/global/mlr/latest_results.json"
 * );
 */
export const useModelData = (config) => {
  const [error, setError] = useState(undefined); // TODO
  const [modelData, setModelData] = useState(undefined);

  useEffect( () => {
    async function fetchAndParse() {
      if (!config.modelUrl) {
        console.log(`Skipping fetching for ${config.modelName} as modelUrl property is not set`)
        return;
      }

      console.log(`Downloading & parsing model data JSON for ${config.modelName} (${config.modelUrl})`)
      let modelJson;
      try {
        modelJson = await fetch(config.modelUrl)
          .then((res) => res.json())
      } catch (err) {
        console.error(err);
        setError(new Error(`Downloading model data JSONs for ${config.modelName} (${config.modelUrl}) failed.`));
        return;
      }
      try {
        setModelData(parseModelData(config.modelName, modelJson, config.sites, config.variantColors, config.variantDisplayNames));
      } catch (err) {
        console.error(err)
        setError(new Error(`Downloading model data JSONs for ${config.modelName} succeeded, but parsing the JSONs failed.`));
        return;
      }
    }

    fetchAndParse();
  }, [config]);


  return {modelData, error}
}
