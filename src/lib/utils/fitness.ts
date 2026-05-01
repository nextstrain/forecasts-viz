import type { GenericTimePoint, ModelData } from "./modelData.types.ts";



// Step 1: compute popGA -- easy
// 
// 
// 
// 
// Step 2: find variants with above 0.0001 frequency
// 
// 
// 
// 
// Step 3: compute relative growth advantage (relative to population average)
// 
// 
// Step ASIDE: plot relative growth advantage as a line...
// 
// 
// Step 4: find variants with > 7 data points
// 
// 
// 
// Step 5: compute a new data structure for statespace
// points → <location> → <variant> → "temporal" → [idx] → "freqGA" → [freq, log(ga) - log(popGA)]
// 
// 
// Step 6: new visualisation for (5)
// 
// We've got ~three "structures" - point-estimates, temporal-estimates, state-space


const SKIP_VARIANT = new Set(['other'])

export function calcRelativeGA(data: ModelData): void {
  const relativeGaDomain: [number, number] = [Infinity, -Infinity];
  const points = data.get('points');
  points.popGA = {};
  points.relativeGA = {};

  for (const location of data.get('locations')) {
    points.relativeGA[location] = {};
    /* First step is to calculate population GA which is a temporal view of
    the sum of each variant's GA x frequency  */
    const popGaTemporal: (GenericTimePoint | undefined)[] = Array(data.get('dateIdx').size);
    const weightedGa: Record<string, number[]> = {};
    for (const variant of data.get('variants')) {
      if (SKIP_VARIANT.has(variant)) continue;
      const ga = points?.ga?.[location]?.[variant]?.value;
      if (ga === undefined) continue;
      const freqTemporal = points?.freq?.[location]?.[variant]?.temporal;
      if (freqTemporal === undefined) continue
      weightedGa[variant] = freqTemporal.map((freqTimePoint, idx) => {
        if (freqTimePoint === undefined) return undefined;
        const value = freqTimePoint.value * ga;
        // popGA is sum over all variants
        if (popGaTemporal[idx] === undefined) {
          popGaTemporal[idx] = { date: freqTimePoint.date, value: 0 };
        }
        popGaTemporal[idx].value += value;
        return value;
      });
    }
    points.popGA[location] = { temporal: popGaTemporal };
    /* Second step is to calculate population-relative growth advantage
     * (for each variant, for each time point) */
    for (const variant of data.get('variants')) {
      if (!Object.hasOwn(weightedGa, variant)) continue;
      points.relativeGA[location][variant] = {
        temporal: weightedGa[variant].map((wGA, tIdx) => {
          if (popGaTemporal[tIdx] === undefined) return undefined;
          const relativeGa = Math.log(wGA) - Math.log(popGaTemporal[tIdx].value);
          if (relativeGa < relativeGaDomain[0]) relativeGaDomain[0] = relativeGa;
          if (relativeGa > relativeGaDomain[1]) relativeGaDomain[1] = relativeGa;
          return { date: data.get('dates')[tIdx], value: relativeGa }
        })
      };
    }
    
    // TODO XXX - smooth?
  }
  data.get('domains').relativeGa = relativeGaDomain;
}

/**
 * Calculate `freqGA` data, which is just a combination of (per-location, per-variant, per-time-point)
 * frequency and relativeGA
 */
export function calcFreqGA(data: ModelData): void {
  const points = data.get('points');
  points.freqGA = {};
  const freqCutoffIdx = data.get('dateIdx').get(data.get('nowcastFinalDate'));
  for (const location of data.get('locations')) {
    points.freqGA[location] = {};
    for (const variant of data.get('variants')) {
      const freqTemporal = points?.freq?.[location]?.[variant]?.temporal;
      const relativeGA = points?.relativeGA?.[location]?.[variant]?.temporal;
      if (!freqTemporal || !relativeGA) continue
      points.freqGA[location][variant] = {
        temporal: Array(data.get('dateIdx').size)
          .fill(undefined)
          .map((_, tIdx) => {
            if (tIdx > freqCutoffIdx) return undefined;
            const [freqPt, relativeGaPt] = [freqTemporal[tIdx], relativeGA[tIdx]];
            if (freqPt === undefined || relativeGaPt === undefined) {
              return undefined;
            }
            return {
              date: freqPt.date,
              freq: freqPt.value,
              relativeGa: relativeGaPt.value,
            };
          })
      };
    }
  }
}