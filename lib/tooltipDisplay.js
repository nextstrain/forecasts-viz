import * as d3 from "d3";

export function displayTopVariants({n=5, fmt=d3.format(".1f")}={}) {
  return function(xy, modelData, params) {
    const dateIdx = modelData.get('dateIdx')
    const locationData = modelData.get('points').get(params.location);
    const xIdx = dateIdx.get(xy[0]);
    let values = [];
    locationData.forEach((variantPoint, variant) => {
      const d = variantPoint.get('temporal')[xIdx];
      if (d.get('date') && d.get(params.key)) {
        values.push([variant, d.get(params.key)])
      }
    });
    let topValues = ''
    values.sort((a, b) => a[1]>b[1] ? -1 : 1)
      .slice(0, n) // take the top 5 variants (highest frequencies)
      .forEach((d) => {
        topValues+=`<p><b>${d[0]}</b> ${fmt(d[1])}</p>`
      })
    return `
      <div>
        <p><b>Date:</b> ${xy[0]}</p>
        <p><b>Top 5 variants:</p>
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
  const fmt = d3.format(".1f");
  return `
    <div>
      <p><b>Variant:</b> ${d.get('variant')}</p>
      <p><b>${params.displayName||params.key}:</b> ${fmt(d.get(`${params.key}`))}</p>
      <p><b>95% HDI:</b> ${fmt(d.get(`${params.key}_HDI_95_lower`))} - ${fmt(d.get(`${params.key}_HDI_95_upper`))}</p>
    </div>
  `
}