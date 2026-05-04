[**@nextstrain/evofr-viz**](../README.md)

***

[@nextstrain/evofr-viz](../README.md) / ControlsProvider

# Function: ControlsProvider()

> **ControlsProvider**(`__namedParameters`): `Element`

Defined in: [hooks/ControlsContext.tsx:35](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/hooks/ControlsContext.tsx#L35)

Provide shared control state for descendant visualisation components.

Wrap `PanelDisplay` with this provider to enable geography filtering and
display toggles such as logit mode and raw-frequency visibility.
Such controls apply to all Panels rendered with this shared control state.

## Parameters

### \_\_namedParameters

#### children

`ReactNode`

## Returns

`Element`

## Example

```tsx
<ControlsProvider>
  <PanelDisplay data={data} params={{ preset: "frequency" }} />
</ControlsProvider>
```
