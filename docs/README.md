**@nextstrain/evofr-viz**

***

# @nextstrain/evofr-viz

React components and hooks for visualising evofr model outputs.

This package exposes:
- `PanelDisplay` for rendering the a set of small-multiple graphs
- `useModelData` for loading and normalising model JSON
- `ControlsProvider` to wrap `<PanelDisplay />` components in order to use shared controls state

Currently the library is used by two other Nextstrain projects:
 - [forecasts-ncov](https://github.com/nextstrain/forecasts-ncov)
 - [forecasts-flu](https://github.com/nextstrain/forecasts-flu)

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

- [Controls](interfaces/Controls.md)
- [D3GraphInstance](interfaces/D3GraphInstance.md)
- [DatasetConfig](interfaces/DatasetConfig.md)
- [FreqData](interfaces/FreqData.md)
- [FreqGAData](interfaces/FreqGAData.md)
- [FreqGaTimePoint](interfaces/FreqGaTimePoint.md)
- [FreqTimePoint](interfaces/FreqTimePoint.md)
- [GaData](interfaces/GaData.md)
- [GenericTimePoint](interfaces/GenericTimePoint.md)
- [GraphParams](interfaces/GraphParams.md)
- [ModelData](interfaces/ModelData.md)
- [ModelDataConfig](interfaces/ModelDataConfig.md)
- [ModelDataWrapper](interfaces/ModelDataWrapper.md)
- [Points](interfaces/Points.md)
- [popGAData](interfaces/popGAData.md)
- [RelativeGAData](interfaces/RelativeGAData.md)

## Type Aliases

- [ChangeGeoFilters](type-aliases/ChangeGeoFilters.md)
- [ChangeVariant](type-aliases/ChangeVariant.md)
- [ChangeVariantAction](type-aliases/ChangeVariantAction.md)
- [GraphParamsWithLocation](type-aliases/GraphParamsWithLocation.md)
- [SelectedGeographies](type-aliases/SelectedGeographies.md)
- [SetVariantsFromFilter](type-aliases/SetVariantsFromFilter.md)
- [UserGraphParams](type-aliases/UserGraphParams.md)

## Functions

- [ControlsProvider](functions/ControlsProvider.md)
- [PanelDisplay](functions/PanelDisplay.md)
- [useModelData](functions/useModelData.md)
