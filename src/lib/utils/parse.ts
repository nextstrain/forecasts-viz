import { max, schemeTableau10 } from 'd3';
import { DatasetConfig } from "./config.ts";
import { ModelData } from "./modelData.types.ts";

/* Maps used instead of object as it's (seemingly) faster + consumes less
 * memory (https://www.zhenghao.io/posts/object-vs-map) */

const THRESHOLD_FREQ = 0.005; /* half a percent */
const INITIAL_DAY_CUTOFF = 10; /* cut off first 10 days */

// TODO check this — the per-site config shape varies (e.g. `freq` carries
// `raw`/`smoothed`; `I_smooth` doesn't). Modelled loosely as `any` until
// the call sites are TS-converted.
const DEFAULT_SITES: Record<string, any> = {
  // Future options: specify the ps values to use, whether to use `${key}_forecast` etc
  ga: {
    temporal: false,
  },
  I_smooth: {
    temporal: true,
    stacked: true,
  },
  freq: {
    temporal: true,
    raw: 'daily_raw_freq',
    smoothed: 'weekly_raw_freq',
  },
};

/**
 * Fetch- and JSON-agnostic parser. Builds a {@link ModelData} from raw
 * model JSON.
 *
 * @throws {@link Error} if a data point references an unknown
 * location/variant.
 *
 * @internal
 */
export const parseModelData = (
  config: DatasetConfig,
  modelJson: any, // TODO check this — model JSON shape needs typing
): ModelData => {
  
  const modelName = config?.modelName || "Unknown";
  console.log(`${modelName} - parsing model data`);

  /** SITES - which keys to parse from model (and how to parse them) */
  const sitesInfo = collectSites(modelJson.metadata.sites, config.sites);

  /** DATES */
  const [dates, updated, nowcastFinalDate, dateSummary, sparseDates] = extractDatesFromModels(modelJson);
  const dateIdx = new Map(dates.map((d, i) => [d, i]));

  /** VARIANTS - e.g. clades, lineages etc. pivot will be first element */
  const { variants, pivot } = extractVariants(modelJson);

  const { locations, locationHierarchy } = checkLocations(modelJson, config.locations, config.locationHierarchy);
  
  const data: ModelData = new Map<string, any>([
    ["locations", locations],
    ["locationHierarchy", locationHierarchy],
    ["variants", variants],
    ["dates", dates],
    ["dateIdx", dateIdx],
    ["sparseDates", sparseDates],
    ["updated", updated],
    ["nowcastFinalDate", nowcastFinalDate],
    ["points", undefined],
    ["domains", undefined],
    ["sites", undefined], /* sites discovered in processModelData */
    ["pivot", pivot],
    ['domains', new Map([])],
    ["variantColors", getVariantColors(modelJson, variants, config.variantColors)],
    ["variantDisplayNames", variantDisplayNames(modelJson, variants, config.variantDisplayNames)],
  ]);

  console.log(`\t${data.get('locations').length} locations x ${data.get('variants').length} variants x ${dates.length} dates`);
  console.log("\t" + dateSummary);

  /** POINTS hold all the actual data for plotting in a hierarchical Map structure.
   * We initialise to the following structure:
   *
   * points → <location> → <variant> → "variant" → <variant>
   *                                 → "temporal" → temporalArray
   *                                              → [idx] → "date" → YYYY-MM-DD || undefined
   *
   * Note: temporal[idx] corresponds to dates[idx]
   * We then add data dependent on the JSON contents, e.g. growth advantage sites add:
   *
   * points → <location> → <variant> → "ga" → float
   *                                 → "ga_HDI_95_lower" → float
   *                                 → "ga_HDI_95_upper" → float
   *
   * and frequencies add:
   *
   * points → <location> → <variant> → "temporal" → [idx] → "freq" → float[idx]
   *                                                      → "freq_HDI_95_lower" → float[idx]
   *                                                      → "freq_HDI_95_upper" → float[idx]
   */

  const points = initialisePoints(data.get('locations'), variants, dates);
  const ps_point_estimator = modelJson.metadata.ps_point_estimator || "median";

  const sites = processModelData(modelJson.data, points, dateIdx, sitesInfo, ps_point_estimator);
  data.set("sites", sites);

  /* Once everything's been added (including frequencies) - iterate over each point & censor certain frequencies */
  if (sitesInfo['freq']) {
    const { nanCount, censorCount } = censorTimePoints(points);
    console.log(`\t${censorCount} censored points as frequency<${THRESHOLD_FREQ}`);
    console.log(`\t${nanCount} points missing`);
  } else {
    console.warn(`Frequencies were not parsed from the model, no censoring of time points has occurred. Model results which had freq<${THRESHOLD_FREQ} may be unreliable.`);
  }

  /** compute stacked coordinates as needed */
  Object.entries(sitesInfo).filter(([_site, info]) => info.stacked === true)
    .forEach(([site, _info]) => {
      computeStackedPoints(points, dates, site);
    });

  /** Compute domains for point estimates */
  Object.entries(sitesInfo).filter(([_site, info]) => info.temporal === false)
    .forEach(([site, _info]) => {
      data.get('domains').set(site, computeBounds(points, site));
    });

  data.set("points", points);

  console.log("DATA", data);
  return data;
};

function collectSites(modelSites: string[], configSites?: any): Record<string, any> {
  let sitesInfo: Record<string, any> = { ...DEFAULT_SITES };

  if (configSites) {
    if (typeof configSites !== 'object') {
      throw new Error(`The config-defined 'sites' has changed to an object (you have provided a ${typeof configSites})`);
    }
    sitesInfo = { ...sitesInfo, ...configSites };
    console.log("Merged config-defined sites with defaults. Combined sites:", sitesInfo);
  }

  // Prune out any sites not in the model JSON
  for (const s of Object.keys(sitesInfo)) {
    if (!modelSites.includes(s)) {
      delete sitesInfo[s];
    }
  }

  return sitesInfo;
}

function extractDatesFromModels(
  modelJson: any,
): [string[], string | undefined, string, string, boolean] {
  const jsonDates: string[] = (modelJson.metadata.dates || []).sort(); // YYYY-MM-DD are sorted correctly
  const jsonDatesForecast: string[] = (modelJson.metadata.forecast_dates || []).sort();

  /**
   * If dates are sparse, then we use them as-is, however if the dates are not sparse we create an array ourselves
   * so that all dates in the period are included. This affects how lines are drawn, as we will not draw lines (and CIs)
   * over "holes" in the dates array.
   */
  const sparse: boolean = Object.hasOwn(modelJson.metadata, "sparseDates") ?
    modelJson.metadata.sparseDates :
    sparseDates(jsonDates);
  const dates: string[] = sparse ?
    [...jsonDates, ...jsonDatesForecast] :
    datesArray(jsonDates[0], max([jsonDates[jsonDates.length - 1], jsonDatesForecast[jsonDatesForecast.length - 1]]));

  /* The forecast date is simply the crossover date between now-casting and forecasting. It's not that simple -- from
  Marlin: "There’s really two different lines that should be there, but I would start with the date of the model run I think."
  */
  const updated: string | undefined = modelJson.metadata?.updated;
  let nowcastFinalDate: string;
  let updatedMsg = '';
  if (updated) {
    nowcastFinalDate = updated;
    updatedMsg = `Forecast starts at ${nowcastFinalDate} (via model update date).`;
  } else {
    nowcastFinalDate = jsonDates[jsonDates.length - 1];
    updatedMsg = `Forecast starts at ${nowcastFinalDate} (final entry in 'dates').`;
  }

  /* If we don't have sparse dates then skip initial days of model estimates to avoid artifacts in plots */
  let keepDates: string[];
  let summary: string;
  if (sparse) {
    keepDates = dates;
    summary = `Provided dates are sparse - there are ${keepDates.length} measurements which span the date range ${keepDates[0]} - ${keepDates[keepDates.length - 1]}. ${updatedMsg}`;
  } else {
    keepDates = dates.slice(INITIAL_DAY_CUTOFF);
    summary = `Dates are not sparse, so the earliest ${INITIAL_DAY_CUTOFF} days have been ignored.`;
    summary += `\n\tDates now span ${keepDates[0]} - ${keepDates[keepDates.length - 1]} (${keepDates.length} days). ${updatedMsg}`;
  }
  return [keepDates, updated, nowcastFinalDate, summary, sparse];
}

export function datesArray(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  // start at noon so that as we enter/exit daylight savings, the +/- 1 hour change doesn't
  // change the day. See src/tests/date-parsing.js for more details
  let d = new Date(`${startDate}T12:00:00Z`);
  while (d.toISOString().split('T')[0] <= endDate) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/**
 * Heuristic check for sparse dates. If over 80% of the dates are
 * subsequent (i.e. `date[x+1] === date[x] + 1 day`) then the data is
 * _not_ sparse.
 */
function sparseDates(dates: string[]): boolean {
  const n = dates.length;
  const objects = dates.map((d) => new Date(d));
  const msPerDay = 1000 * 60 * 60 * 24;
  const proportionSingleDaySpacing = objects.map((d, i) => {
    if (i === 0) return 0;
    return Math.round((d.getTime() - objects[i - 1].getTime()) / msPerDay);
  }).filter((gap) => gap === 1).length / n;
  return proportionSingleDaySpacing < 0.8;
}

function extractVariants(modelJson: any): { variants: string[]; pivot: string } {
  // Reorder variants so that the pivot is first for all displays
  const variants: string[] = [...modelJson.metadata.variants];
  // Use the explicit pivot in the metadata if available, otherwise assume the
  // pivot is the last variant in the array
  const pivot: string = modelJson.metadata.pivot || variants[variants.length - 1];
  const pivotIndex = variants.indexOf(pivot);
  if (pivotIndex >= 0) {
    variants.splice(pivotIndex, 1);
    variants.unshift(pivot);
  }
  return { variants, pivot };
}

function variantDisplayNames(
  modelJson: any,
  variants: string[],
  configProvidedVariantDisplayNames?: Map<string, string>,
): Map<string, string> {
  if (configProvidedVariantDisplayNames) {
    return configProvidedVariantDisplayNames;
  }
  if (Array.isArray(modelJson.metadata?.variantDisplayNames)) {
    return new Map(modelJson.metadata.variantDisplayNames);
  }
  return new Map(variants.map((name) => [name, name]));
}

function getVariantColors(
  modelJson: any,
  variants: string[],
  configProvidedVariantColors?: Map<string, string>,
): Map<string, string> {
  let variantColors: Map<string, string>;
  if (configProvidedVariantColors) {
    variantColors = configProvidedVariantColors;
  } else if (Array.isArray(modelJson.metadata?.variantColors)) {
    variantColors = new Map(modelJson.metadata.variantColors);
  } else {
    // Todo - sample from a continuous scale when we have more than 10 variants
    // (e.g. collapsed pango lineages will have lots more!)
    variantColors = new Map(variants.map((name, idx) => [name, schemeTableau10[idx % 10]]));
  }

  const missingColors = variants.filter((v) => !variantColors.has(v));
  if (missingColors.length) {
    console.error(
      `Missing colors for ${missingColors.length} variant(s): ${missingColors.join(', ')}\n\n` +
      `All variants should have colors defined in metadata.variantColors.\n` +
      `(Grey will be used for these missing variants as a fallback)`,
    );
    for (const v of missingColors) {
      variantColors.set(v, '#bdbdbd');
    }
  }

  return variantColors;
}

// TODO check this — `TimePoint` is currently a Map keyed by string with
// heterogeneous values (date string, frequencies, stack offsets, ...).
// Worth becoming a real interface once the consumer types are nailed down.
type TimePoint = Map<string, any>;

/**
 * Returns a {@link TimePoint} — a Map with a key of `date` and the value
 * set to the `date` argument.
 */
function timePoint(date: string | undefined = undefined): TimePoint {
  return new Map<string, any>([
    ['date', date],
  ]);
}

// TODO check this — `Points` is the hierarchical Map described in
// `parseModelData` above. Typed loosely until call sites are converted.
type Points = Map<string, Map<string, Map<string, any>>>;

function initialisePoints(locations: string[], variants: string[], dates: string[]): Points {
  return new Map(
    locations.map((location) => [
      location,
      new Map(
        variants.map((variant) => [
          variant,
          new Map<string, any>([
            ['variant', variant],
            ['temporal', dates.map(timePoint)],
          ]),
        ]),
      ),
    ]),
  );
}

function computeBounds(points: Points, key: string): [number, number] {
  let _min = 100;
  let _max = 0;
  const keyLower = `${key}_HDI_95_lower`;
  const keyUpper = `${key}_HDI_95_upper`;
  for (const variantMap of points.values()) {
    for (const variantPoint of variantMap.values()) {
      if (variantPoint.get(keyLower) < _min) {
        _min = variantPoint.get(keyLower);
      } else if (variantPoint.get(keyUpper) > _max) {
        _max = variantPoint.get(keyUpper);
      }
    }
  }
  return [_min, _max];
}

function censorTimePoints(points: Points): { nanCount: number; censorCount: number } {
  let [nanCount, censorCount] = [0, 0];
  /**
   * for any timePoint where the frequency is either not provided (NaN) or
   * under our threshold, we don't want to use any model output for this date
   * (for the given variant, location))
   */
  const censor = (point: TimePoint, idx: number, dateList: TimePoint[]) => {
    const freq = point.get('freq');
    if (isNaN(freq)) {
      dateList[idx] = timePoint();
      nanCount++;
    } else if (freq < THRESHOLD_FREQ) {
      dateList[idx] = timePoint();
      censorCount++;
    }
  };
  for (const variantMap of points.values()) {
    for (const variantPoint of variantMap.values()) {
      const dateList: TimePoint[] = variantPoint.get('temporal');
      dateList.forEach(censor);
    }
  }
  return { nanCount, censorCount };
}

/**
 * The `key` must already be set within `points` (and be temporal). This
 * adds `${key}_y0` and `${key}_y1` values with the stacking order
 * determined by the variant order.
 */
function computeStackedPoints(points: Points, dates: string[], key: string): void {
  for (const variantMap of points.values()) {
    let runningTotalPerDay = new Array(dates.length).fill(0);
    for (const variantPoint of variantMap.values()) {
      const dateList: TimePoint[] = variantPoint.get('temporal');
      dateList.forEach((point, idx) => {
        point.set(`${key}_y0`, runningTotalPerDay[idx]);
        runningTotalPerDay[idx] += point.get(key) || 0; // may be NaN
        point.set(`${key}_y1`, runningTotalPerDay[idx]);
      });
    }
  }
}

/**
 * Dynamically add points to the data store by looping over the JSON data
 * elements. The dynamic nature comes from the user being able to select
 * what fields are parsed and how they should be parsed.
 */
function processModelData(
  data: any[], // TODO check this — array of model JSON `data` rows
  points: Points,
  dateIdx: Map<string, number>,
  sitesInfo: Record<string, any>,
  ps_point_estimator: string,
): Set<string | undefined> {
  const keysAdded = new Set<string | undefined>();
  const keyInfo: Record<string, any> = {};
  const lookup: Record<string, (store: Map<string, any>, d: any) => string | undefined> = {};

  for (const [siteName, siteInfo] of Object.entries(sitesInfo)) {
    keyInfo[siteName] = siteInfo;
    lookup[siteName] = defaultGetter(siteName);
    if (siteInfo.raw) {
      keyInfo[siteInfo.raw] = siteInfo;
      lookup[siteInfo.raw] = simpleGetter('freq_raw');
    }
    if (siteInfo.smoothed) {
      keyInfo[siteInfo.smoothed] = siteInfo;
      lookup[siteInfo.smoothed] = simpleGetter('freq_smoothed');
    }
  }

  function defaultGetter(baseKey: string) {
    return (store: Map<string, any>, d: any): string | undefined => {
      const key = d.ps === ps_point_estimator ? baseKey
        : d.ps === "HDI_95_lower" ? `${baseKey}_HDI_95_lower`
          : d.ps === "HDI_95_upper" ? `${baseKey}_HDI_95_upper`
            : undefined;
      if (!key) return undefined;
      store.set(key, d.value);
      return key;
    };
  }

  function simpleGetter(baseKey: string) { // doesn't consider the ps value
    return (store: Map<string, any>, d: any): string => {
      store.set(baseKey, d.value);
      return baseKey;
    };
  }

  const lookupKeys = new Set(Object.keys(lookup));

  for (const d of data) {
    /* The site in the JSON isn't necessarily the key we store data under as we don't store forecasts under a different key */
    // TODO - allow the sitesInfo to enable this via `useForecast` boolean
    const key = d.site.replace("_forecast", "");

    if (lookupKeys.has(key)) {
      if (keyInfo[key].temporal === true && dateIdx.get(d.date) === undefined) continue;
      
      // The user-config may restrict the locations, which flows into the keys present in `points`
      // so skip processing this element if its location is not present in points.
      const locationMap = points.get(d.location);
      if (!locationMap) {
        continue
      }
      const variantPoint = locationMap.get(d.variant);
      if (!variantPoint) {
        console.error(`ERROR at data point: Variant "${d.variant}" not found in metadata.variants`);
        console.error(`Available variants: ${Array.from(locationMap.keys()).join(', ')}`);
        console.error(`Problematic data point:`, d);
        throw new Error(`Variant "${d.variant}" in data not found in metadata.variants. Available variants: ${Array.from(locationMap.keys()).join(', ')}`);
      }

      const store = keyInfo[key].temporal === true ?
        variantPoint.get('temporal')[dateIdx.get(d.date)] :
        variantPoint;

      const storeKey = lookup[key](store, d);
      keysAdded.add(storeKey);
    }
  }
  return keysAdded;
}


function checkLocations(
  modelJson: any,
  configLocations: DatasetConfig['locations'],
  configLocationHierarchy: DatasetConfig['locationHierarchy'],
): { locations: DatasetConfig['locations'], locationHierarchy: DatasetConfig['locationHierarchy']|undefined} {

  /** First handle the locations themselves - use the config provided ones if provided,
   * but filter against those present in the model.
   */
  const missingConfigLocations = new Set();
  const modelLocations = modelJson.metadata.location;
  const locations = configLocations ?
    configLocations.filter((loc) => {
      if (modelLocations.includes(loc)) return true;
      missingConfigLocations.add(loc);
      return false;
    }) :
    modelLocations;

  /** Now the locationHierarchy */
  const locationHierarchy: DatasetConfig['locationHierarchy'] | undefined =
    configLocationHierarchy ?
      configLocationHierarchy :
      modelJson.metadata.locationHierarchy ?
        new Map(
          Object.entries(modelJson.metadata.locationHierarchy).map(([category, values]) => [
            category,
            new Map(Object.entries(values)),
          ]),
        ) :
        undefined;

  /** If we have one, validate it against locations */
  if (locationHierarchy) {
    const locationSet = new Set(locations);
    for (const [category, values] of locationHierarchy) {
      for (const [value, locs] of values) {
        const valid = locs.filter((loc) => locationSet.has(loc));
        if (valid.length < locs.length) {
          const removed = locs.filter((loc) => !locationSet.has(loc));
          console.warn(`locationHierarchy "${category}" → "${value}": removed locations not in data: ${removed.join(', ')}`);
        }
        values.set(value, valid);
      }
    }
  }

  if (missingConfigLocations.size) {
    console.warn(`Config object specified locations not present in the data: ${[...missingConfigLocations].join(', ')}`)
  }

  if (!locations.length) throw new Error(`No locations!`)

  return {locations, locationHierarchy}
}