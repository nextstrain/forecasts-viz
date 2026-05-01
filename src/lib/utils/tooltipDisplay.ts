import * as d3 from "d3";

export function displayTopVariants({ n = 5, fmt = d3.format(".1f") } = {}) {
  return function (xy, modelData, params, selectedVariants) {
    const dateIdx = modelData.get('dateIdx')
    const locationData = modelData.get('points')[params.key]?.[params.location] || {};
    const xIdx = dateIdx.get(xy[0]);
    let values = [];
    Object.entries(locationData).forEach(([variant, data]: [string, any]) => {
      const el = data.temporal[xIdx];
      if (!el) return;
      values.push([variant, el.value]);
    });
    let topValues = '';
    values
      .filter(([variant,]) => selectedVariants.size ? selectedVariants.has(variant) : true)
      .sort((a, b) => a[1] > b[1] ? -1 : 1)
      .slice(0, n) // take the top 5 variants (highest frequencies)
      .forEach((d) => {
        topValues += `<p><b>${d[0]}</b> ${fmt(d[1])}</p>`
      });
    const subtitle = selectedVariants.size ? 'Top selected variants:' : 'Top 5 variants:';
    return `
      <div>
        <p><b>Date:</b> ${xy[0]}</p>
        <p><b>${subtitle}</p>
        ${topValues}
      </div>
    `
  }
}

/**
 * @param {Map} d ("d" for d3 datum)
 * @param {object} params
 * @returns {HtmlString}
 * @private
 */
export function categoryPointTooltip(d, params) {
  console.log(d)
  const fmt = d3.format(".1f");
  // TODO XXX - make HPD/HDI/CI config-definable
  return `
    <div>
      <p><b>Variant:</b> ${d.variant}</p>
      <p><b>${params.displayName || params.key}:</b> ${fmt(d.value)}</p>
      <p><b>95% HDI:</b> ${fmt(d.lower)} - ${fmt(d.upper)}</p>
    </div>
  `
}