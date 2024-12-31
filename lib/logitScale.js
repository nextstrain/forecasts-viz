/**
 * A d3 scale based off d3's continuos scale source code - see
 * https://github.com/d3/d3-scale/blob/main/src/continuous.js
 * This would be easier if we could import `transformer` etc,
 * however d3(-scale) doesn't expose them so we recreate a lot of the
 * code here (with much less error checking etc).
 * @private
 */
export function logitScale() {
    return transformer()
  }
  
  function transformer() {
    let domain;
    let range;
    let clamp = (x) => x;
    // following lifted into closure to avoid them being computed every time we call scale(x)
    let transformedDomain;
    let domainNormalizer
    let rangeInterpolator;
  
    function rescale() {
      /**
       * logit(x) is bounded by -Infinity (as x -> 0) and Infinity (as x -> 1)
       * but here we are forcing the domain to be between x of 0.005 (0.5%) and x=0.99 (99.0%)
       * See also THRESHOLD_FREQ in `./utils/parse.js`, as frequency values below this are not
       * included in the model data (currently 0.5%)
       */
      if (domain && domain[0]<0.005) domain[0]=0.005;
      if (domain && domain[1]>0.99) domain[1]=0.99;
      clamp = function(x) {
        if (x<domain[0]) return domain[0]
        if (x>domain[1]) return domain[1]
        return x
      }
      if (domain && range) {
        transformedDomain = domain && domain.map(transform);
        domainNormalizer = (x) => (x - transformedDomain[0]) / (transformedDomain[1]-transformedDomain[0]); // the position in the transformed domain
        rangeInterpolator = interpolateNumber(range[0], range[1]);
      }
      return scale;
    }
  
    function transform(x) {
      if (x<=0) {
        return NaN; // todo
      } else if (x>=1) {
        return NaN;
      }
      return Math.log(x/(1-x)); // natural logarithm
    }
    function untransform(y) {
      return 1 - 1/(1+Math.exp(y))
    }
  
    function scale(x) {
      const transformedX = transform(clamp(x));
      return rangeInterpolator(domainNormalizer(transformedX))
    }
    scale.invert = function(y) {
      const domainInterpolator = interpolateNumber(transformedDomain[0], transformedDomain[1]);
      const rangeNormalizer = (y) => (y-range[0]) / (range[1]-range[0]);
      return clamp(untransform(domainInterpolator(rangeNormalizer(y))));
    }
    scale.range = function(_) {
      return arguments.length ? (range = _, rescale()) : range.slice();
    }
    scale.domain = function(_) {
      return arguments.length ? (domain = _, rescale()) : domain.slice();
    }
    scale.copy = function() {
      return scale;
    }
    scale.clamp = function(_) {
      throw new Error("custom clamping not yet enabled")
    }
  
    /**
     * This scale is intended to be used with d3.axisLeft (https://github.com/d3/d3-axis/blob/main/src/axis.js)
     * By default the tickArguments are `[]` (modified if you call .tickArguments on the axis).
     * The axis obtains tick values via `scale.ticks.apply(scale, tickArguments)` i.e. `scale.ticks()`
     * and also a tickFormatter via `scale.tickFormat.apply(scale, tickArguments)` i.e. `scale.tickFormat()`
     * however we typically provide our own formatter.
     */
    scale.ticks = function() {
      return [0.01, 0.10, 0.5, 0.90, 0.99].filter((x) => x>=domain[0] && x<=domain[1])
    }
    return rescale();
  }
  
  
  // https://github.com/d3/d3-interpolate/blob/main/src/number.js
  function interpolateNumber(a, b) {
    return a = +a, b = +b, function(t) { // eslint-disable-line
      return a * (1 - t) + b * t;
    };
  }
  
  // following is useful for simple command line testing:
  // node --input-type=module < ./src/lib/utils/logitScale.js
  // const s = logitScale().domain([0, 1]).range([0, 100]);
  // console.log(`Logit transform of x in ${s.domain()} -> ${s.range()} pixel space`)
  // for (const x of [0, 0.001, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.999, 1]) {
  //   console.log(`logit(${x}) = ${s(x)}px. Inverted: x=${s.invert(s(x))}`)
  // }