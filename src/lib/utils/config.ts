import type { ModelDataConfig } from "./modelData.types";

/**
 * Configuration for fetching and parsing a model dataset.
 * 
 */
export interface DatasetConfig {
  /** Name of the model — used to improve clarity of error messages. */
  modelName: string;

  /** Address to fetch the model JSON from. */
  modelUrl: string;

  /**
   * How to parse the sites in the JSON. Merged into the defaults.
   */
  sites?: Partial<ModelDataConfig['sitesInfo']>;

  /**
   * Colours for the variants specified in the model JSONs.
   * Overrides `modelJson.metadata.variantColors`.
   * If not provided here or in the JSON, a default colour scale is used.
   */
  variantColors?: Map<string, string>;

  /**
   * Display names for the variants specified in the model JSONs.
   * Overrides `modelJson.metadata.variantDisplayNames`.
   * If not provided here or in the JSON, variant keys are used as labels.
   */
  variantDisplayNames?: Map<string, string>;
  
  /**
   * Restrict the parsing of the JSON to these locations.
   * Locations that are not present in `modelJson.metadata.location` are removed.
   * The order guides the ordering of the visualisation.
   */
  locations?: string[]
  
  /**
   * Optional hierarchy of locations for filtering and related UI.
   * Structure: `locationHierarchy -> category -> value -> list of locations`.
   * For example: `"region" -> "oceania" -> ["New Zealand", "Australia", ...]`.
   */
  locationHierarchy?: Map<string, Map<string, string[]>>
}
