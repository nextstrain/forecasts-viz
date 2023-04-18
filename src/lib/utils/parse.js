import { min, max } from 'd3';

/**
 * Maps used instead of object as it's (seemingly) faster + consumes less
 * memory (https://www.zhenghao.io/posts/object-vs-map)
 * @private
 */

/**
 * @typedef {Map} TimePoint
 * An data point representing a model estimate at a certain date
 * @property {(string|undefined)} date
 * @property {(number|NaN)} freq
 * @property {(number|NaN)} I_smooth
 * @property {(number|NaN)} I_smooth_y0
 * @property {(number|NaN)} I_smooth_y1
 * @property {(number|NaN)} r_t
 * @inner
 * @memberof module:@nextstrain/evofr-viz
 */
const TimePoint = new Map([
  ['date', undefined],
  ['freq', NaN],
  ['I_smooth', NaN],
  ['I_smooth_y0', NaN], // stacked
  ['I_smooth_y1', NaN], // stacked
  ['r_t', NaN],
]);

/**
 * @typedef {Map} VariantPoint
 * An data point representing a model estimate for a variant.
 * The properties defined directly here are not specific to any date.
 * Date-specific estimates are specified via `temporal`
 * @property {(string|undefined)} variant Variant name
 * @property {(number|undefined)} ga Growth Advantage
 * @property {(Array|undefined)} temporal Array of `TimePoint` estimates
 * @inner
 * @memberof module:@nextstrain/evofr-viz
 */
const VariantPoint = new Map([
  ['ga', undefined],
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
export const parseModelData = (renewal, mlr, variantColors, variantDisplayNames) => {

  ensureModelConsistency(renewal, mlr, ['location', 'variants']); // throws upon inconsistency
  const [dates, nowcastFinalDate] = extractDatesFromModels(renewal, mlr)
  const dateIdx = new Map(dates.map((d, i) => [d, i]));

  const data = new Map([
    ["locations", renewal.metadata.location],
    ["variants", renewal.metadata.variants],
    ["dates", dates],
    ["variantColors", variantColors],
    ["variantDisplayNames", variantDisplayNames],
    ["dateIdx", dateIdx],
    ["nowcastFinalDate", nowcastFinalDate],
    ["points", undefined],
    ["domains", undefined],
    // TODO: use the explicit pivot in the metadata instead of assuming the
    // pivot is the last variant in the array once it has been added to the evofr output
    ["pivot", mlr.metadata.variants[mlr.metadata.variants.length - 1]]
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

  /* Iterate through each data element & assign to our structure */
  renewal.data
    .filter((d) => dateIdx.get(d.date) !== undefined) /* filter out skipped dates */
    .forEach((d) => {
      if (d.site==="R") {
        if (d.ps==="median") {
          points.get(d.location).get(d.variant).get('temporal')[dateIdx.get(d.date)].set('r_t', d.value);
        } else if (d.ps==="HDI_95_lower") {
          points.get(d.location).get(d.variant).get('temporal')[dateIdx.get(d.date)].set('r_t_HDI_95_lower', d.value);
        } else if (d.ps==="HDI_95_upper") {
          points.get(d.location).get(d.variant).get('temporal')[dateIdx.get(d.date)].set('r_t_HDI_95_upper', d.value);
        }
      }
      else if (d.site==="I_smooth") {
        if (d.ps==="median") {
          points.get(d.location).get(d.variant).get('temporal')[dateIdx.get(d.date)].set('I_smooth', d.value);
        }
      }
    });
  mlr.data
    .filter((d) => {
      // if data has a date, filter out skipped dates
      if (d.date) {
        return dateIdx.get(d.date) !== undefined;
      }
      return true;
    })
    .forEach((d) => {
      if (d.site==="freq" | d.site==="freq_forecast") {
        // if (dateIdx.get(d.date) % 50) return
        if (d.ps==="median") {
          points.get(d.location).get(d.variant).get('temporal')[dateIdx.get(d.date)].set('freq', d.value);
        } else if (d.ps==="HDI_95_lower") {
          points.get(d.location).get(d.variant).get('temporal')[dateIdx.get(d.date)].set('freq_HDI_95_lower', d.value);
        } else if (d.ps==="HDI_95_upper") {
          points.get(d.location).get(d.variant).get('temporal')[dateIdx.get(d.date)].set('freq_HDI_95_upper', d.value);
        }
      } else if (d.site==="ga") {
        if (d.ps==="median") {
          points.get(d.location).get(d.variant).set('ga', d.value);
        } else if (d.ps==="HDI_95_lower") {
          points.get(d.location).get(d.variant).set('ga_HDI_95_lower', d.value);
        } else if (d.ps==="HDI_95_upper") {
          points.get(d.location).get(d.variant).set('ga_HDI_95_upper', d.value);
        }
      }
    });


  /* Once everything's been added (including frequencies) - iterate over each point & censor certain frequencies */
  let [nanCount, censorCount] = [0, 0];

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

  /* create a stack for I_smooth to help with plotting - this could be in the previous set of
  loops but it's here for readability */
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

  data.set('domains', new Map([
    ['ga', [ga_min, ga_max]],
  ]));

  console.log(`Renewal model data`)
  console.log(`\t${renewal.metadata.location.length} locations x ${renewal.metadata.variants.length} variants x ${dates.length} dates`)
  console.log(`\tNote: The earliest ${INITIAL_DAY_CUTOFF} days have been ignored`);
  console.log(`\t${censorCount} censored points as frequency<${THRESHOLD_FREQ}`);
  console.log(`\t${nanCount} points missing`);

  data.set("points", points);
  return data;
};


function ensureModelConsistency(renewal, mlr, keys) {
  let errMsg = ''
  for (const key of keys) {
    if (renewal.metadata[key].length!==mlr.metadata[key]) {
      const a = renewal.metadata[key].filter((x) => !mlr.metadata[key].includes(x));
      const b = mlr.metadata[key].filter((x) => !renewal.metadata[key].includes(x));
      if (a.length || b.length) {
        errMsg += `Inconsistency between Renewal & MLR models for ${key}; values only in renewal model: ${a.join(", ")}, only in MRL model: ${b.join(", ")}. `
      }
    }
  }
  if (errMsg) {
    throw new Error(errMsg);
  }
}

/**
 * All graphs currently use a single (common) array of dates. This work is in
 * flux as we incorporate forecasted (future) dates, which only certain models
 * may use. Our approach to dates, especially as they compare between models,
 * should be revisited.
 * @private 
 */
function extractDatesFromModels(renewal, mlr) {
  const renewalDates = (renewal.metadata.dates || []).sort(); // YYYY-MM-DD are sorted correctly
  const renewalDatesForecast = (renewal.metadata.forecast_dates || []).sort();
  const mlrDates = (mlr.metadata.dates || []).sort();
  const mlrDatesForecast = (mlr.metadata.forecast_dates || []).sort();

  console.log(renewalDates[renewalDates.length-1], mlrDates[mlrDates.length-1])

  /* are the dates different? Log this if so - it is not a problem, per-se, but we should be aware of it. */
  let startDate 
  if (renewalDates[0] === mlrDates[0]) {
    startDate = renewalDates[0];
  } else {
    startDate = min([renewalDates[0], mlrDates[0]]);
    console.log(`The models start on different dates. Renewal: ${renewalDates[0]}, mlr: ${mlrDates[0]}; using ${startDate}`)
  }

  let endDate;
  if (renewalDates[renewalDates.length-1] === mlrDates[mlrDates.length-1]) {
    endDate = renewalDates[renewalDates.length-1];
  } else {
    endDate = max([renewalDates[renewalDates.length-1], mlrDates[mlrDates.length-1]]);
    console.log(`The models end on different dates. Renewal: ${renewalDates[renewalDates.length-1]}, mlr: ${mlrDates[mlrDates.length-1]}; using ${endDate}`)
  }
  
  console.log("Forecast renewal date range", renewalDatesForecast[0], renewalDatesForecast[renewalDatesForecast.length-1])
  console.log("Forecast MLR date range", mlrDatesForecast[0], mlrDatesForecast[mlrDatesForecast.length-1])

  /* currently we only consider the MLR forecasts */
  const lastForecastDate = mlrDatesForecast[mlrDatesForecast.length-1];

  /* because we use the dates as the domain for graphs, create the array ourselves to ensure no holes */
  const dates = [];
  let d = new Date(startDate);
  const endDateForViz = new Date(max([endDate, lastForecastDate]));
  while (d <= endDateForViz) {
    dates.push(d.toISOString().split("T")[0]); // YYYY-MM-DD
    d.setDate(d.getDate()+1); // increment one day
  }

  /* The forecast date is simply the crossover date between now-casting and forecasting. It's not that simple -- from
  Marlin: "There’s really two different lines that should be there, but I would start with the date of the model run I think."
  But we don't currently encode the date of the model run! I'm using end of MLR `dates` but I expect this to be added to the JSON
  shortly */
  const nowcastFinalDate = mlrDates[mlrDates.length-1];

  /* Skip initial days of model estimates to avoid artifacts in plots */
  const keepDates = dates.slice(INITIAL_DAY_CUTOFF);
  console.log(`After removing initial ${INITIAL_DAY_CUTOFF} days, model dates (including forecasting) are: ${keepDates[0]} - ${keepDates[keepDates.length-1]} (${keepDates.length} days)`);
  return [keepDates, nowcastFinalDate];
}