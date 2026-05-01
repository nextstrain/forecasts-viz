import { max, schemeTableau10 } from 'd3';
import { DatasetConfig } from "./config.ts";
import { ModelData, Points, ModelDataConfig } from "./modelData.types.ts";
import { calcRelativeGA, calcFreqGA} from "./fitness.ts"

const THRESHOLD_FREQ = 0.005; /* half a percent */
const INITIAL_DAY_CUTOFF = 10; /* cut off first 10 days */


const DEFAULT_SITES: ModelDataConfig['sitesInfo'] = {
  // Future options: specify the ps values to use, whether to use `${key}_forecast` etc
  ga: {
    ps_point_estimator: 'median',
    ps_interval_estimator: ['HDI_95_lower', 'HDI_95_upper'],
    interval_name: "95% HDI",
  },
  freq: {
    estimateSites: ['freq', 'freq_forecast'],
    ps_point_estimator: 'median',
    ps_interval_estimator: ['HDI_95_lower', 'HDI_95_upper'],
    interval_name: "95% HDI",
    raw_site: 'daily_raw_freq',
    raw_name: 'Daily Raw Frequency',
    smoothed_site: 'weekly_raw_freq',
    smoothed_name: 'Weekly Raw Frequency',
  },
  relativeGA: {
    enable: true,
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
  const sitesInfo = collectSites(config.sites);

  /** DATES */
  const [dates, updated, nowcastFinalDate, dateSummary, sparseDates] = extractDatesFromModels(modelJson);
  const dateIdx = new Map(dates.map((d, i) => [d, i]));

  /** VARIANTS - e.g. clades, lineages etc. pivot will be first element */
  const { variants, pivot } = extractVariants(modelJson);

  const { locations, locationHierarchy } = checkLocations(modelJson, config.locations, config.locationHierarchy);
  
  const data: ModelData = new Map<string, any>([
    ["config", {sitesInfo}], // TODO XXX
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

  /** POINTS hold all the actual data for plotting.
   * Structure: Points.freq[location][variant].temporal[dateIdx] → FreqTimePoint
   *            Points.ga[location][variant] → GaData
   */

  const points = initialisePoints(data.get('locations'), variants, dateIdx.size, sitesInfo);

  processModelData(modelJson.data, points, dateIdx, sitesInfo);

  /* Once everything's been added (including frequencies) - iterate over each point & censor certain frequencies */
  if (sitesInfo['freq']) {
    const { nanCount, censorCount } = censorTimePoints(points);
    console.log(`\t${censorCount} censored points as frequency<${THRESHOLD_FREQ}`);
    console.log(`\t${nanCount} points missing`);
  } else {
    console.warn(`Frequencies were not parsed from the model, no censoring of time points has occurred. Model results which had freq<${THRESHOLD_FREQ} may be unreliable.`);
  }

  // TODO - drop variants entirely if their _max_ is under some threshold
  
  /** compute stacked coordinates as needed */
  // TODO XXX
  Object.entries(sitesInfo).filter(([_site, info]) => info.stacked === true)
    .forEach(([site, _info]) => {
      computeStackedPoints(points, dates, site);
    });

  data.set('domains', {
    'ga': computeBounds(points, 'ga'), // TODO why only ga?
  });
  
  data.set("points", points);

  if (sitesInfo.relativeGA?.enable) {
    calcRelativeGA(data);
    calcFreqGA(data);
  }

  console.log("DATA", data);
  return data;
};

function collectSites(configSites?: any): Record<string, any> {
  let sitesInfo: Record<string, any> = { ...DEFAULT_SITES };

  if (configSites) {
    if (typeof configSites !== 'object') {
      throw new Error(`The config-defined 'sites' has changed to an object (you have provided a ${typeof configSites})`);
    }
    sitesInfo = { ...sitesInfo, ...configSites };
    console.log("Merged config-defined sites with defaults. Combined sites:", sitesInfo);
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


function initialisePoints(locations: string[], variants: string[], nDates: number, sitesInfo: Record<string, any>): Points {
  const points: Points = {};
  if (Object.hasOwn(sitesInfo, 'freq')) {
    points.freq = {};
    for (const location of locations) {
      points.freq[location] = {};
      for (const variant of variants) {
        points.freq[location][variant] = { temporal: new Array(nDates) };
      }
    }
  }
  if (Object.hasOwn(sitesInfo, 'ga')) {
    points.ga = {};
    for (const location of locations) {
      points.ga[location] = {};
      for (const variant of variants) {
        points.ga[location][variant] = {};
      }
    }
  }
  return points;
}

function computeBounds(points: Points, key: 'ga'): [number, number] {
  let [_min, _max] = [Infinity, -Infinity];
  const siteData = points[key]!;
  for (const locationData of Object.values(siteData)) {
    for (const valuePt of Object.values(locationData)) {
      if (valuePt.value! < _min) _min = valuePt.value!;
      if (valuePt.value! > _max) _max = valuePt.value!;
      if (valuePt.lower !== undefined && valuePt.lower < _min) _min = valuePt.lower;
      if (valuePt.upper !== undefined && valuePt.upper > _max) _max = valuePt.upper;
    }
  }
  return [_min, _max];
}

/**
 * for any timePoint where the associated ps value is either not provided or
 * under our threshold, we don't want to use any model output for this date
 * (for the given variant, location))
 */
function censorTimePoints(points: Points): { nanCount: number; censorCount: number } {
  let [nanCount, censorCount] = [0, 0];
  for (const locationData of Object.values(points.freq!)) {
    for (const freqData of Object.values(locationData)) {
      const temporalData = freqData.temporal;
      if (!temporalData) {
        console.log("Skip?")
        continue
      }
      temporalData.forEach((el, idx) => {
        if (el?.value===undefined) {
          nanCount; // TODO XXX it's not nan
        } else if (el.value < THRESHOLD_FREQ) {
          temporalData[idx] = undefined;
          censorCount++;
        }
      })
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
  const siteData = points[key];
  if (!siteData) return;
  for (const locationData of Object.values(siteData)) {
    const runningTotalPerDay = new Array(dates.length).fill(0);
    for (const variantData of Object.values(locationData)) {
      const dateList = variantData?.temporal;
      if (!dateList) continue;
      dateList.forEach((point, idx) => {
        if (!point) return;
        const p = point as Record<string, any>;
        p[`${key}_y0`] = runningTotalPerDay[idx];
        runningTotalPerDay[idx] += (p[key] || 0);
        p[`${key}_y1`] = runningTotalPerDay[idx];
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
): void {
  // const keysAdded = new Set<string | undefined>();
  // const keyInfo: Record<string, any> = {};
  // const lookup: Record<string, (store: Map<string, any>, d: any) => string | undefined> = {};

  // The data format is tough to work with, so partition things by site.
  const locations = new Set(Object.keys(points.freq || points.ga || {}));
  const dataBySite: Record<string,Record<string,any>[]> = {};
  for (const el of data) {
    const { site, location } = el;
    if (!locations.has(location)) continue;
    if (!Object.hasOwn(dataBySite, site)) dataBySite[site] = [];
    dataBySite[site].push(el)
  }

  if (Object.hasOwn(sitesInfo, 'freq')) {
    // TODO -- generalise for any _temporal_ key, but only 'freq' for now!
    console.log("------ processing 'freq' ------- ", sitesInfo.freq);
    const { estimateSites, ps_point_estimator, ps_interval_estimator, raw_site, smoothed_site } = sitesInfo.freq;
    for (const estimateKey of estimateSites) {
      if (!Object.hasOwn(dataBySite, estimateKey)) {
        console.warn(`config specified site ${estimateKey} which was not found in data`);
        continue;
      }
      for (const el of dataBySite[estimateKey]) {
        const { variant, location, ps, date, value } = el;
        const _t = points.freq![location][variant].temporal;
        const idx = dateIdx.get(date);
        if (idx === undefined) {
          console.log("undefined date idx", estimateKey)
          continue
        }
        if (!_t[idx]) _t[idx] = {date};
        if (ps === ps_point_estimator) _t[idx].value = value;
        if (ps_interval_estimator) {
          if (ps === ps_interval_estimator[0]) _t[idx].lower = value;
          if (ps === ps_interval_estimator[1]) _t[idx].upper = value;
        }
      }
    }
    // TODO: make this dynamic if we want to allow an arbitrary number of sites like this
    // but this would entail dynamic UI parts as well
    for (const d of [['raw', raw_site], ['smoothed', smoothed_site]]) {
      const [name, site] = d;
      if (!site) continue;
      if (!Object.hasOwn(dataBySite, site)) {
        console.warn(`Config specified freq ${name} site key '${site}' but no matching data elements`);
      } else {
        for (const el of dataBySite[site]) {
          const { variant, location, date, value } = el;
          const point = points.freq![location][variant].temporal?.[dateIdx.get(date)!];
          if (!point) {
            console.log("Skipping site", site)
            continue;
          }
          point[name] = value;
        }
      }
    }    
  }

  if (Object.hasOwn(sitesInfo, 'ga')) {
    if (!Object.hasOwn(dataBySite, 'ga')) {
      console.warn(`config specified site 'ga' which was not found in data`);
    } else {
      const { ps_point_estimator, ps_interval_estimator } = sitesInfo.ga;
      for (const el of dataBySite.ga) {
        const { variant, location, value, ps } = el;
        const point = points.ga![location][variant]
        if (ps === ps_point_estimator) point.value = value;
        if (ps_interval_estimator) {
          if (ps === ps_interval_estimator[0]) point.lower = value;
          if (ps === ps_interval_estimator[1]) point.upper = value;
        }
      }
    }
  }
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