import { useState, useEffect, useRef } from 'react';
import { isEqual } from './isEqual.js';
import { parseModelData, ModelData } from './parse.js';

/**
 * A custom React Hook that returns a memoized value that will only
 * change if a deep comparison determines the value is not equivalent
 * to the previous value.
 *
 * Copied from Auspice
 * (https://github.com/nextstrain/auspice/blob/6370cc5a682824b607dcd0314c1821e99bd636f7/src/components/measurements/index.tsx#L65-L76).
 */
function useDeepCompareMemo<T>(value: T): T {
  const ref = useRef<T>();
  if (!isEqual(value, ref.current)) {
    ref.current = value;
  }
  return ref.current as T;
}

/**
 * Configuration for the datasets to fetch & parse.
 *
 * Currently the library is only built for `forecasts-ncov` model data
 * and so there are hardcoded expectations. These will be lifted up and
 * made config-options so that this library is pathogen agnostic.
 */
export interface DatasetConfig {
  /** Name of the model — used to improve clarity of error messages. */
  modelName: string;

  /** Address to fetch the model JSON from. */
  modelUrl: string;

  /**
   * List of sites to extract from JSON. If not provided we will use the
   * sites set in the JSON metadata.
   */
  // TODO check this — current shape is roughly
  // `Record<siteName, { temporal, stacked, raw, smoothed }>`
  // (see DEFAULT_SITES in `parse.ts`).
  sites?: any;

  /**
   * Colours for the variants specified in the model JSONs. A default
   * colour scale is available.
   */
  variantColors?: Map<string, string>;

  /**
   * Display names for the variants specified in the model JSONs. If not
   * provided we use the keys as names.
   */
  variantDisplayNames?: Map<string, string>;
}

/** Return type of {@link useModelData}. */
export interface ModelDataWrapper {
  modelData: ModelData | undefined;
  /** Errors encountered during JSON fetch / parse. */
  error: Error | undefined;
}

/**
 * Fetch and parse the model data (JSON).
 *
 * The returned object is designed to be passed to a `<PanelDisplay>`
 * component as its `data` prop. If an error is encountered it is also
 * logged via `console.error()`.
 *
 * @example
 * ```ts
 * const mlrData = useModelData({
 *   modelName: "MLR",
 *   modelUrl: "https://nextstrain-data.s3.amazonaws.com/files/workflows/forecasts-ncov/gisaid/nextstrain_clades/global/mlr/latest_results.json",
 * });
 * ```
 */
export const useModelData = (config: DatasetConfig): ModelDataWrapper => {
  const [error, setError] = useState<Error | undefined>(undefined); // TODO
  const [modelData, setModelData] = useState<ModelData | undefined>(undefined);

  // Memoize the config param so that the effect below only runs when the
  // object _value_ has changed and not just the object reference
  const memoizedConfig = useDeepCompareMemo(config);

  useEffect(() => {
    async function fetchAndParse() {
      if (!memoizedConfig.modelUrl) {
        console.log(`Skipping fetching for ${memoizedConfig.modelName} as modelUrl property is not set`);
        return;
      }

      console.log(`Downloading & parsing model data JSON for ${memoizedConfig.modelName} (${memoizedConfig.modelUrl})`);
      let modelJson;
      try {
        modelJson = await fetch(memoizedConfig.modelUrl)
          .then((res) => res.json());
      } catch (err) {
        console.error(err);
        setError(new Error(`Downloading model data JSONs for ${memoizedConfig.modelName} (${memoizedConfig.modelUrl}) failed.`));
        return;
      }
      try {
        setModelData(parseModelData(memoizedConfig.modelName, modelJson, memoizedConfig.sites, memoizedConfig.variantColors, memoizedConfig.variantDisplayNames));
      } catch (err) {
        console.error(err);
        setError(new Error(`Downloading model data JSONs for ${memoizedConfig.modelName} succeeded, but parsing the JSONs failed.`));
        return;
      }
    }

    fetchAndParse();
  }, [memoizedConfig]);

  return { modelData, error };
};
