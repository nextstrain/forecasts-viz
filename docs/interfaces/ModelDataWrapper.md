[**@nextstrain/evofr-viz**](../README.md)

***

[@nextstrain/evofr-viz](../README.md) / ModelDataWrapper

# Interface: ModelDataWrapper

Defined in: [utils/useModelData.ts:29](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/useModelData.ts#L29)

Result returned by [useModelData](../functions/useModelData.md).

While data is being fetched and parsed, `modelData` is `undefined`. If the
request or parsing fails, `error` is populated.

## Properties

### error

> **error**: `Error`

Defined in: [utils/useModelData.ts:33](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/useModelData.ts#L33)

Errors encountered during JSON fetch / parse.

***

### modelData

> **modelData**: [`ModelData`](ModelData.md)

Defined in: [utils/useModelData.ts:31](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/useModelData.ts#L31)

Parsed model data, or `undefined` while loading.
