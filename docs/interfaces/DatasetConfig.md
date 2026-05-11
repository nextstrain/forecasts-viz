[**@nextstrain/evofr-viz**](../README.md)

***

[@nextstrain/evofr-viz](../README.md) / DatasetConfig

# Interface: DatasetConfig

Defined in: [utils/config.ts:7](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/config.ts#L7)

Configuration for fetching and parsing a model dataset.

## Properties

### locationHierarchy?

> `optional` **locationHierarchy?**: `Map`\<`string`, `Map`\<`string`, `string`[]\>\>

Defined in: [utils/config.ts:45](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/config.ts#L45)

Optional hierarchy of locations for filtering and related UI.
Structure: `locationHierarchy -> category -> value -> list of locations`.
For example: `"region" -> "oceania" -> ["New Zealand", "Australia", ...]`.

***

### locations?

> `optional` **locations?**: `string`[]

Defined in: [utils/config.ts:38](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/config.ts#L38)

Restrict the parsing of the JSON to these locations.
Locations that are not present in `modelJson.metadata.location` are removed.
The order guides the ordering of the visualisation.

***

### modelName

> **modelName**: `string`

Defined in: [utils/config.ts:9](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/config.ts#L9)

Name of the model — used to improve clarity of error messages.

***

### modelUrl

> **modelUrl**: `string`

Defined in: [utils/config.ts:12](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/config.ts#L12)

Address to fetch the model JSON from.

***

### sites?

> `optional` **sites?**: `Partial`\<[`ModelDataConfig`](ModelDataConfig.md)\[`"sitesInfo"`\]\>

Defined in: [utils/config.ts:17](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/config.ts#L17)

How to parse the sites in the JSON. Merged into the defaults.

***

### variantColors?

> `optional` **variantColors?**: `Map`\<`string`, `string`\>

Defined in: [utils/config.ts:24](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/config.ts#L24)

Colours for the variants specified in the model JSONs.
Overrides `modelJson.metadata.variantColors`.
If not provided here or in the JSON, a default colour scale is used.

***

### variantDisplayNames?

> `optional` **variantDisplayNames?**: `Map`\<`string`, `string`\>

Defined in: [utils/config.ts:31](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/config.ts#L31)

Display names for the variants specified in the model JSONs.
Overrides `modelJson.metadata.variantDisplayNames`.
If not provided here or in the JSON, variant keys are used as labels.
