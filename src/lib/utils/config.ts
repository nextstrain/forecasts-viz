
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
   * Colours for the variants specified in the model JSONs.
   * Overrides `modelJson.metadata.variantColors`
   * If not provided (here nor JSON) we will use a default colour scale.
   */
  variantColors?: Map<string, string>;

  /**
   * Display names for the variants specified in the model JSONs.
   * Overrides `modelJson.metadata.variantDisplayNames`
   * If not provided (here nor JSON) we use the keys as names.
   */
  variantDisplayNames?: Map<string, string>;
  
  /**
   * Restrict the parsing of the JSON to these locations.
   * Locations here which are not in modelJson.metadata.location will be removed. 
   * The order guides the ordering of the visualisation.
   */
  locations?: string[]
  
  /**
   * Encode a heirarchy of locations here which can be used for filtering and other future uses
   * Structure: locationHierarchy -> cateogry -> value -> list of locations
   * E.g.:      locationHierarchy -> "region" -> "oceania" -> ["New Zealand", "Australia", ...]
   */
  locationHierarchy?: Map<string, Map<string, string[]>>
}
