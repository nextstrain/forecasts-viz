[**@nextstrain/evofr-viz**](../README.md)

***

[@nextstrain/evofr-viz](../README.md) / ControlsProvider

# Function: ControlsProvider()

> **ControlsProvider**(`__namedParameters`): `Element`

Defined in: [hooks/ControlsContext.tsx:33](https://github.com/nextstrain/forecasts-viz/blob/90e17ff143d6266cc094fc456c6d04e0ac6ca980/src/lib/hooks/ControlsContext.tsx#L33)

Provide shared control state for descendant visualisation components.

Wrap `PanelDisplay` with this provider to enable geography filtering and
display toggles such as logit mode and raw-frequency visibility.
Such controls apply to all Panels rendered with this shared control state

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
