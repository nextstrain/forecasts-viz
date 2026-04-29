**@nextstrain/evofr-viz**

***

# @nextstrain/evofr-viz

React components and hooks for visualising evofr model outputs.

This package exposes:
- `PanelDisplay` for rendering the a set of small-multiple graphs
- `useModelData` for loading and normalising model JSON
- `ControlsProvider` to wrap `<PanelDisplay />` components in order to use shared controls state

Currently the library is used by two other Nextstrain projects:
 - [forecasts-ncov](https://github.com/nextstrain/forecasts-ncov) and
 - [forecasts-flu](https://github.com/nextstrain/forecasts-flu).

## Remarks

Consumers must also import the packaged stylesheet:

```ts
import '@nextstrain/evofr-viz/dist/index.css';
```

## Example

```ts
import '@nextstrain/evofr-viz/dist/index.css';
import { PanelDisplay, useModelData } from '@nextstrain/evofr-viz';
```

## Interfaces

- [DatasetConfig](interfaces/DatasetConfig.md)
- [ModelData](interfaces/ModelData.md)
- [ModelDataWrapper](interfaces/ModelDataWrapper.md)

## Functions

- [ControlsProvider](functions/ControlsProvider.md)
- [PanelDisplay](functions/PanelDisplay.md)
- [useModelData](functions/useModelData.md)
