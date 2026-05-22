import type { GenericTimePoint, ModelData, MeanPopFitnessData, GaData, FreqData, RelativeFitnessData } from "./modelData.types.ts";


const SKIP_VARIANT = new Set(['other', 'hierarchical'])


/**
 * Creates `data.points.meanPopFitness` `data.points.relativeFitness` structures.
 * 
 * Mean population fitness is the sum of freq_i(t) * ga_i
 * for all variants i.
 * 
 * Relative fitness is log(ga_i / meanPopFit(t))
 * 
 * Each of these includes forecasted dates (forecasted frequencies)
 * 
 * <https://bedford.io/talks/viral-fitness-flux-penn-iizd/#/15>
 */
export function calcFitness(data: ModelData): void {
  const points = data.get('points');
  points.meanPopFitness = {};
  points.relativeFitness = {};
  let [relativeFitnessLower, relativeFitnessUpper]: [number, number] = [Infinity, -Infinity]; // bounds
  for (const [location, variantFreqs] of Object.entries(points.freq)) {
    const locGa = points?.ga?.[location];
    const locMeanPopFit = _locationMeanPopFitness(location, data.get('dates'), locGa, variantFreqs);
    points.meanPopFitness[location] = locMeanPopFit;
    const [locLower, relFitUpper, locRelFit] = _relativeFitness(location, locGa, locMeanPopFit.temporal);
    if (locLower < relativeFitnessLower) relativeFitnessLower = locLower;
    if (relFitUpper > relativeFitnessUpper) relativeFitnessUpper = relFitUpper;    
    points.relativeFitness[location] = locRelFit;
  }
  console.log("*** overall relative fitness bounds:", relativeFitnessLower, relativeFitnessUpper)
  data.get('domains').relativeFitness = [relativeFitnessLower, relativeFitnessUpper];
}

function _locationMeanPopFitness(
  location: string,
  dates: string[],
  locationGa: Record<string, GaData>,
  locationFreq: Record<string, FreqData>,
): MeanPopFitnessData {
  const fitnessSum = Array(dates.length).fill(0);
  for (const [variant, freqs] of Object.entries(locationFreq)) {
    if (SKIP_VARIANT.has(variant)) continue;
    const ga = locationGa?.[variant]?.value;
    if (ga === undefined) continue;
    freqs.temporal.forEach((f, idx) => {
      /* not all variants have frequency data for all time points (censoring) */
      if (!f) return;
      fitnessSum[idx] += f.value * ga
    });
    console.log(`locationMeanPopFitness: ${location} ${variant} ${fitnessSum.slice(0,5).join(" ")}`)
  }
  let [lower, upper]: [number, number] = [Infinity, -Infinity];
  const temporal = fitnessSum.map((value, idx) => {
    if (value < lower) lower = value;
    if (value > upper) upper = value;
    return { date: dates[idx], value };
  });
  return { lower, upper, temporal };
}

function _relativeFitness(
  location: string,
  locationGa: Record<string, GaData>,
  meanPopFitnessValues: MeanPopFitnessData['temporal'],
): [number, number, Record<string, RelativeFitnessData>] {

  const locRelFit: Record<string, RelativeFitnessData> = {}; // location relative fitness
  let [lower, upper]: [number, number] = [Infinity, -Infinity]; // location bounds

  for (const [variant, gaData] of Object.entries(locationGa)) {
    if (SKIP_VARIANT.has(variant) || !Object.hasOwn(gaData, 'value')) continue;
    const ga = gaData.value!;
    const temporal = meanPopFitnessValues.map((timePt) => {
      console.log("GA", ga, "POP", timePt.value)
      const popFit = timePt.value || 1e-12;
      const value = Math.log(ga) - Math.log(popFit); // log(a/b) == log(a) - log(b)
      if (value < lower) lower = value;
      if (value > upper) upper = value;      
      return {
        date: timePt.date,
        value: Math.log(ga) - Math.log(timePt.value),
        // nonLogValue: ga / timePt.value,
      }
    });
    // console.log(`location relative fitness (ga: ${ga}) RAW: ${location} ${variant} ${temporal.slice(0, 5).map((x) => x.nonLogValue).join(" ")}`)
    console.log(`location relative fitness (ga: ${ga}) LOG: ${location} ${variant} ${temporal.slice(0, 5).map((x) => x.value).join(" ")}`)
    locRelFit[variant] = { temporal };
  }
  console.log(`**location relative fitness bounds ${lower} ${upper}\n\n`)
  return [lower, upper, locRelFit];
}

