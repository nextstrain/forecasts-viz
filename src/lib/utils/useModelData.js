import {useState, useEffect} from 'react';
import {parseModelData} from "./parse.js";


/**
 * @typedef {Object} ModelDataWrapper
 * @property {(ModelData|undefined)} modelData
 * @property {(Error|undefined)} error
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
 * @property {Set|undefined} sites list of sites to extract from JSON. Undefined will use the sites set in the JSON metadata.
 * @property {Map<string,string>} variantColors colors for the variants specified in the model JSONs
 * @property {Map<string,string>} variantDisplayNames display names for the variants specified in the model JSONs
 * @inner
 * @memberof module:@nextstrain/evofr-viz
 */


/**
 * Fetch and parse the model data (JSON)
 * @param {DatasetConfig} config 
 * @returns {ModelDataWrapper}
 * @memberof module:@nextstrain/evofr-viz
 */
export const useModelData = (config) => {
  const [error, setError] = useState(undefined); // TODO
  const [modelData, setModelData] = useState(undefined);

  useEffect( () => {
    async function fetchAndParse() {
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