/**
 * @packageDocumentation
 * React components and hooks for visualising evofr model outputs.
 *
 * This package exposes:
 * - `PanelDisplay` for rendering the a set of small-multiple graphs
 * - `useModelData` for loading and normalising model JSON
 * - `ControlsProvider` to wrap `<PanelDisplay />` components in order to use shared controls state
 *
 * Currently the library is used by two other Nextstrain projects:
 *  - [forecasts-ncov](https://github.com/nextstrain/forecasts-ncov)
 *  - [forecasts-flu](https://github.com/nextstrain/forecasts-flu)
 * 
 * @remarks
 * Consumers must also import the packaged stylesheet:
 *
 * ```ts
 * import '@nextstrain/evofr-viz/dist/index.css';
 * ```
 *
 * @example
 * ```ts
 * import '@nextstrain/evofr-viz/dist/index.css';
 * import { PanelDisplay, useModelData } from '@nextstrain/evofr-viz';
 * ```
 */
import { PanelDisplay } from './components/Panels.tsx';
import { useModelData } from "./utils/useModelData.ts";
import { ControlsProvider } from "./hooks/ControlsContext.tsx";

export { PanelDisplay, useModelData, ControlsProvider };
  
/* public-facing API types */
export type { ModelData } from "./utils/modelData.types.ts";
export type { DatasetConfig } from "./utils/config.ts";
export type { ModelDataWrapper } from "./utils/useModelData.ts";
