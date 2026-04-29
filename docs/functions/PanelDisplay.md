[**@nextstrain/evofr-viz**](../README.md)

***

[@nextstrain/evofr-viz](../README.md) / PanelDisplay

# Function: PanelDisplay()

> **PanelDisplay**(`__namedParameters`): `Element`

Defined in: [components/Panels.tsx:142](https://github.com/nextstrain/forecasts-viz/blob/90e17ff143d6266cc094fc456c6d04e0ac6ca980/src/lib/components/Panels.tsx#L142)

Render a panel of small-multiple graphs for the currently selected locations.

Pass the [ModelDataWrapper](../interfaces/ModelDataWrapper.md) returned by `useModelData` as the `data`
prop. The `params` prop selects which graph preset or graph definition to
render, and `styles` can override the default sizing used for each graph.

## Parameters

### \_\_namedParameters

#### data

[`ModelDataWrapper`](../interfaces/ModelDataWrapper.md)

#### locations?

`string`[]

#### params

`any`

#### styles?

`any`

## Returns

`Element`

## Remarks

This component reads its interactive state from [ControlsProvider](ControlsProvider.md).
Render it inside that provider if you want geography filters and display
toggles to work correctly.

The `locations` prop is deprecated. Prefer dataset configuration and shared
controls state to determine which locations are shown.

## Examples

```tsx
<PanelDisplay data={data} params={{ preset: "frequency" }} />
```

```tsx
<PanelDisplay
  data={data}
  params={{
    graphType: "lines",
    key: "I_smooth",
    interval: ["I_smooth_HDI_95_lower", "I_smooth_HDI_95_upper"],
    intervalOpacity: 0.3,
    yDomain: getDomainUsingKey("I_smooth_HDI_95_upper"),
    tooltipXY: displayTopVariants(),
  }}
/>
```

```tsx
<PanelDisplay
  data={data}
  styles={{ height: 300, width: 400 }}
  params={{ preset: "stackedIncidence" }}
/>
```
