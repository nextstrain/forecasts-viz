[**@nextstrain/evofr-viz**](../README.md)

***

[@nextstrain/evofr-viz](../README.md) / useModelData

# Function: useModelData()

> **useModelData**(`config`): [`ModelDataWrapper`](../interfaces/ModelDataWrapper.md)

Defined in: [utils/useModelData.ts:54](https://github.com/nextstrain/forecasts-viz/blob/90e17ff143d6266cc094fc456c6d04e0ac6ca980/src/lib/utils/useModelData.ts#L54)

Fetch and parse the model data (JSON).

The returned object is designed to be passed to a `<PanelDisplay>`
component as its `data` prop. If an error is encountered it is also
logged via `console.error()`.

## Parameters

### config

[`DatasetConfig`](../interfaces/DatasetConfig.md)

Dataset location and parsing options.

## Returns

[`ModelDataWrapper`](../interfaces/ModelDataWrapper.md)

The current loading state, parsed data, and any fetch or parse error.

## Example

```ts
const mlrData = useModelData({
  modelName: "MLR",
  modelUrl: "https://nextstrain-data.s3.amazonaws.com/files/workflows/forecasts-ncov/gisaid/nextstrain_clades/global/mlr/latest_results.json",
});
```
