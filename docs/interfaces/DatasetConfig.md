[**@nextstrain/evofr-viz**](../README.md)

***

[@nextstrain/evofr-viz](../README.md) / DatasetConfig

# Interface: DatasetConfig

Defined in: [utils/config.ts:6](https://github.com/nextstrain/forecasts-viz/blob/90e17ff143d6266cc094fc456c6d04e0ac6ca980/src/lib/utils/config.ts#L6)

Configuration for fetching and parsing a model dataset.

## Properties

### locationHierarchy?

> `optional` **locationHierarchy?**: `Map`\<`string`, `Map`\<`string`, `string`[]\>\>

Defined in: [utils/config.ts:48](https://github.com/nextstrain/forecasts-viz/blob/90e17ff143d6266cc094fc456c6d04e0ac6ca980/src/lib/utils/config.ts#L48)

Optional hierarchy of locations for filtering and related UI.
Structure: `locationHierarchy -> category -> value -> list of locations`.
For example: `"region" -> "oceania" -> ["New Zealand", "Australia", ...]`.

***

### locations?

> `optional` **locations?**: `string`[]

Defined in: [utils/config.ts:41](https://github.com/nextstrain/forecasts-viz/blob/90e17ff143d6266cc094fc456c6d04e0ac6ca980/src/lib/utils/config.ts#L41)

Restrict the parsing of the JSON to these locations.
Locations that are not present in `modelJson.metadata.location` are removed.
The order guides the ordering of the visualisation.

***

### modelName

> **modelName**: `string`

Defined in: [utils/config.ts:8](https://github.com/nextstrain/forecasts-viz/blob/90e17ff143d6266cc094fc456c6d04e0ac6ca980/src/lib/utils/config.ts#L8)

Name of the model — used to improve clarity of error messages.

***

### modelUrl

> **modelUrl**: `string`

Defined in: [utils/config.ts:11](https://github.com/nextstrain/forecasts-viz/blob/90e17ff143d6266cc094fc456c6d04e0ac6ca980/src/lib/utils/config.ts#L11)

Address to fetch the model JSON from.

***

### sites?

> `optional` **sites?**: `any`

Defined in: [utils/config.ts:20](https://github.com/nextstrain/forecasts-viz/blob/90e17ff143d6266cc094fc456c6d04e0ac6ca980/src/lib/utils/config.ts#L20)

List of sites to extract from JSON. If not provided we will use the
sites listed in the JSON metadata.

***

### variantColors?

> `optional` **variantColors?**: `Map`\<`string`, `string`\>

Defined in: [utils/config.ts:27](https://github.com/nextstrain/forecasts-viz/blob/90e17ff143d6266cc094fc456c6d04e0ac6ca980/src/lib/utils/config.ts#L27)

Colours for the variants specified in the model JSONs.
Overrides `modelJson.metadata.variantColors`.
If not provided here or in the JSON, a default colour scale is used.

***

### variantDisplayNames?

> `optional` **variantDisplayNames?**: `Map`\<`string`, `string`\>

Defined in: [utils/config.ts:34](https://github.com/nextstrain/forecasts-viz/blob/90e17ff143d6266cc094fc456c6d04e0ac6ca980/src/lib/utils/config.ts#L34)

Display names for the variants specified in the model JSONs.
Overrides `modelJson.metadata.variantDisplayNames`.
If not provided here or in the JSON, variant keys are used as labels.
