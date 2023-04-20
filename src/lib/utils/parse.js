import { max } from 'd3';

/**
 * Maps used instead of object as it's (seemingly) faster + consumes less
 * memory (https://www.zhenghao.io/posts/object-vs-map)
 * @private
 */

/**
 * @typedef {Map} TimePoint
 * An data point representing a model estimate at a certain date
 * Extra properties (e.g. "freq") are added in a data-dependent manner.
 * @property {(string|undefined)} date
 * @inner
 * @memberof module:@nextstrain/evofr-viz
 */
const TimePoint = new Map([
  ['date', undefined],
]);

/**
 * @typedef {Map} VariantPoint
 * An data point representing a model estimate for a variant.
 * The properties defined directly here are not specific to any date.
 * Date-specific estimates are specified via `temporal`
 * Extra properties (e.g. "ga") are added in a data-dependent manner.
 * @property {(string|undefined)} variant Variant name
 * @property {(Array|undefined)} temporal Array of `TimePoint` estimates
 * @inner
 * @memberof module:@nextstrain/evofr-viz
 */
const VariantPoint = new Map([
  // ['ga', undefined],
  ['temporal', undefined],
  ['variant', undefined],
])
const initialisePointsPerVariant = (variant, dates) => {
  const p = new Map(VariantPoint);
  p.set('variant', variant)
  p.set('temporal', dates.map((date) => {
    const tp = new Map(TimePoint);
    tp.set('date', date);
    return tp;
  }));
  return p;
}

const THRESHOLD_FREQ = 0.005; /* half a percent */
const INITIAL_DAY_CUTOFF = 10; /* cut off first 10 days */


/**
 * @typedef {Map} ModelData
 * @property {Points} points
 * @property {Array} variants (from renewal model)
 * @property {Array} dates (from renewal model, with some early dates removed)
 * @property {Array} locations (from renewal model)
 * @property {Map} dateIdx lookup for date string -> idx in dates array
 * @property {Map} variantColors
 * @property {Map} variantDisplayNames
 * @property {String} pivot (final entry in MLR model's list of variants)
 * @property {Map} dateIdx
 * @inner
 * @memberof module:@nextstrain/evofr-viz
 */

/**
 * @returns {ModelData}
 * @private
 * @throws Error
 */
export const parseModelData = (modelName, modelJson, sites, variantColors, variantDisplayNames) => {

  if (!sites){
    sites = new Set(modelJson.metadata.sites);
  } else {
    // TODO - ensure provided sites are a subset of JSON sites
  }

  const [dates, nowcastFinalDate, dateSummary] = extractDatesFromModels(modelJson)
  const dateIdx = new Map(dates.map((d, i) => [d, i]));

  const data = new Map([
    ["locations", modelJson.metadata.location],
    ["variants", modelJson.metadata.variants],
    ["dates", dates],
    ["variantColors", variantColors],
    ["variantDisplayNames", variantDisplayNames],
    ["dateIdx", dateIdx],
    ["nowcastFinalDate", nowcastFinalDate],
    ["points", undefined],
    ["domains", undefined],
    // TODO: use the explicit pivot in the metadata instead of assuming the
    // pivot is the last variant in the array once it has been added to the evofr output
    ["pivot", modelJson.metadata.variants[modelJson.metadata.variants.length - 1]]
  ])

  let ga_min=100, ga_max=0;

  const points = new Map(
    data.get('locations').map((location) => [
      location,
      new Map(
        data.get('variants').map((variant) => [
          variant,
          initialisePointsPerVariant(variant, dates)
        ])
      )
    ])
  );

  const pointEstimates = new Set(['ga']);

  modelJson.data
    .forEach((d) => {
      const site = d.site;
      if (sites.has(site)) {
        const store = pointEstimates.has(site) ?
          points.get(d.location).get(d.variant) : 
          points.get(d.location).get(d.variant).get('temporal')[dateIdx.get(d.date)];

        /* if it's not a point estimate enforce a date */
        if (!pointEstimates.has(site) && dateIdx.get(d.date) === undefined) return;

        /* don't store forecasts under a different key, as they'll be plotted in the same graph */
        const key = site.replace("_forecast", "");

        if (d.ps==="median") {
          store.set(key, d.value);
        } else if (d.ps==="HDI_95_lower") {
          store.set(`${key}_HDI_95_lower`, d.value);
        } else if (d.ps==="HDI_95_upper") {
          store.set(`${key}_HDI_95_upper`, d.value);
        }
      }
    })

  /* Once everything's been added (including frequencies) - iterate over each point & censor certain frequencies */
  let [nanCount, censorCount] = [0, 0];

  if (sites.has('freq')) {
    /**
     * for any timePoint where the frequency is either not provided (NaN) or
     * under our threshold, we don't want to use any model output for this date
     * (for the given variant, location))
     */
    const censorTimePoints = (point, idx, dateList) => {
      const freq = point.get('freq');
      if (isNaN(freq)) {
        dateList[idx] = new Map(TimePoint);
        nanCount++;
      } else if (freq<THRESHOLD_FREQ) {
        dateList[idx] = new Map(TimePoint);
        censorCount++;
      }
    }
    for (const variantMap of points.values()) {
      for (const variantPoint of variantMap.values()) {
        const dateList = variantPoint.get('temporal');
        dateList.forEach(censorTimePoints)
        // set non-temporal domains
        if (variantPoint.get('ga_HDI_95_lower')<ga_min) {
          ga_min = variantPoint.get('ga_HDI_95_lower');
        } else if (variantPoint.get('ga_HDI_95_upper')>ga_max) {
          ga_max = variantPoint.get('ga_HDI_95_upper')
        }
      }
    }
  } else {
    console.warn(`Frequencies were not parsed from the model, no censoring of time points has occurred. Model results which had freq<${THRESHOLD_FREQ} may be unreliable.`)
  }

  /* create a stack for I_smooth to help with plotting - this could be in the previous set of
  loops but it's here for readability */
  if (sites.has('I_smooth')) {
    for (const variantMap of points.values()) {
      let runningTotalPerDay = new Array(dates.length).fill(0);
      for (const variantPoint of variantMap.values()) {
        const dateList = variantPoint.get('temporal');
        dateList.forEach((point, idx) => {
          point.set('I_smooth_y0', runningTotalPerDay[idx]);
          runningTotalPerDay[idx] += point.get('I_smooth') || 0; // I_smooth may be NaN
          point.set('I_smooth_y1', runningTotalPerDay[idx]);
        })
      }
    }
  }

  if (sites.has('ga')) {
    data.set('domains', new Map([
      ['ga', [ga_min, ga_max]],
    ]));
  }

  console.log(`${modelName} model data`)
  console.log(`\t${data.get('locations').length} locations x ${data.get('variants').length} variants x ${dates.length} dates`)
  console.log(`\tNote: The earliest ${INITIAL_DAY_CUTOFF} days have been ignored`);
  console.log(`\t${censorCount} censored points as frequency<${THRESHOLD_FREQ}`);
  console.log(`\t${nanCount} points missing`);
  console.log("\t"+dateSummary);

  data.set("points", points);
  return data;
};

/**
 * @private 
 */
function extractDatesFromModels(modelJson) {
  const jsonDates = (modelJson.metadata.dates || []).sort(); // YYYY-MM-DD are sorted correctly
  const jsonDatesForecast = (modelJson.metadata.forecast_dates || []).sort();

  /* because we use the dates as the domain for graphs, create the array ourselves to ensure no holes */
  const dates = [];
  let d = new Date(jsonDates[0]);
  const endDateForViz = new Date(max([jsonDates[jsonDates.length-1], jsonDatesForecast[jsonDatesForecast.length-1]]));
  while (d <= endDateForViz) {
    dates.push(d.toISOString().split("T")[0]); // YYYY-MM-DD
    d.setDate(d.getDate()+1); // increment one day
  }

  /* The forecast date is simply the crossover date between now-casting and forecasting. It's not that simple -- from
  Marlin: "There’s really two different lines that should be there, but I would start with the date of the model run I think."
  But we don't currently encode the date of the model run! I'm using end of the JSON's `dates` but I expect this to be added to the JSON
  shortly */
  const nowcastFinalDate = jsonDates[jsonDates.length-1];

  /* Skip initial days of model estimates to avoid artifacts in plots */
  const keepDates = dates.slice(INITIAL_DAY_CUTOFF);
  const summary = `After removing initial ${INITIAL_DAY_CUTOFF} days, model dates are: ${keepDates[0]} - ${keepDates[keepDates.length-1]} (${keepDates.length} days). Forecast starts at ${nowcastFinalDate}`;
  return [keepDates, nowcastFinalDate, summary];
}
