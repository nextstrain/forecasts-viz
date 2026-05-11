[**@nextstrain/evofr-viz**](../README.md)

***

[@nextstrain/evofr-viz](../README.md) / ModelDataConfig

# Interface: ModelDataConfig

Defined in: [utils/modelData.types.ts:41](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/modelData.types.ts#L41)

## Properties

### sitesInfo

> **sitesInfo**: `object`

Defined in: [utils/modelData.types.ts:43](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/modelData.types.ts#L43)

Information about the sites

#### freq

> **freq**: `object`

##### freq.estimateSites

> **estimateSites**: `string`[]

site values which contain the model estimate values

##### freq.interval\_name

> **interval\_name**: `string`

display name of the interval

##### freq.ps\_interval\_estimator?

> `optional` **ps\_interval\_estimator?**: \[`string`, `string`\]

ps values to use as the model estimate intervals (HPD/HPI/CI etc)

##### freq.ps\_point\_estimator

> **ps\_point\_estimator**: `string`

ps value to use as the model estimate value for estimateSites

##### freq.raw\_name

> **raw\_name**: `string`

name to display for the `raw_site` data

##### freq.raw\_site

> **raw\_site**: `string`

site value for raw measurements

##### freq.smoothed\_name

> **smoothed\_name**: `string`

name to display for the `raw_site` data

##### freq.smoothed\_site

> **smoothed\_site**: `string`

site value for smoothed measurements

#### ga

> **ga**: `object`

##### ga.interval\_name

> **interval\_name**: `string`

display name of the interval

##### ga.ps\_interval\_estimator?

> `optional` **ps\_interval\_estimator?**: \[`string`, `string`\]

ps values to use as the model estimate intervals (HPD/HPI/CI etc)

##### ga.ps\_point\_estimator

> **ps\_point\_estimator**: `string`

ps value to use as the model estimate value for estimateSites

#### relativeGA

> **relativeGA**: `object`

##### relativeGA.enable

> **enable**: `boolean`

Compute popGA and relativeGA at parse time. Needed to plot certain graphs.
