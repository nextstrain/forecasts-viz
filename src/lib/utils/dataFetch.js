import {useState, useEffect} from 'react';
import {parseModelData} from "./parse.js";


/**
 * @typedef {Object} ContextData
 * The data made available via React Context
 * @property {(ModelData|undefined)} modelData
 * @property {string} status
 * @property {(Error|undefined)} error
 * @inner
 * @memberof module:@nextstrain/forecasts-viz
 */

/**
 * @typedef {Object} DatasetConfig
 * Configuration for the datasets to fetch & parse
 * Currently the library is only built for `forecasts-ncov` model data
 * and so there are hardcoded expectations. These will be lifted up and
 * made config-options so that this library is pathogen agnostic.
 *
 * @property {string} mlrUrl Address to fetch the MLR model JSON
 * @property {string} renewalUrl Address to fetch the Renewal model JSON
 * @property {Map<string,string>} variantColors colors for the variants specified in the model JSONs
 * @property {Map<string,string>} variantDisplayNames display names for the variants specified in the model JSONs
 * @inner
 * @memberof module:@nextstrain/forecasts-viz
 */


/**
 * @param {DatasetConfig} config 
 * @returns {ContextData}
 * @private
 */
export const useDataFetch = (config) => {
  const [status, setStatus] = useState('Downloading model data JSONs (n=2)...');
  const [error, setError] = useState(undefined); // TODO
  const [modelData, setModelData] = useState(undefined);

  useEffect( () => {
    // start both fetches immediately
    const renewalJson = fetch(config.renewalUrl)
      .then((res) => res.json())
    const mlrJson = fetch(config.mlrUrl)
      .then((res) => res.json())

    async function fetchAndParse() {
      let renewalData, mlrData
      try {
        renewalData = await renewalJson;
        mlrData = await mlrJson;
      } catch (err) {
        setStatus('Downloading model data JSONs failed.')
        setError(err);
        return;
      }
      setStatus("Data downloaded. Processing the data now...")
      try {
        setModelData(parseModelData(renewalData, mlrData, config.variantColors, config.variantDisplayNames));
      } catch (err) {
        setStatus('Downloading model data JSONs succeeded, but parsing the JSONs failed.');
        setError(err);
      }
      setStatus("Data ready for visualisation.")
    }

    fetchAndParse();
  }, [config]);


  return {modelData, status, error}
}
