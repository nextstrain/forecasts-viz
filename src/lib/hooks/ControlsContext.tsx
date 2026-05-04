import React, { createContext, useContext, ReactNode } from 'react';
import { useControls, Controls } from './useControls';

const defaultControls: Controls & { _isDefault?: true } = {
  _isDefault: true,
  changeVariant: () => {},
  setVariantsFromFilter: () => {},
  selectedVariants: new Set(),
  selectedGeographies: [],
  changeGeoFilters: () => {},
  logit: false,
  toggleLogit: () => {},
  rawPoints: false,
  toggleRawPoints: () => {},
  smoothedPoints: false,
  toggleSmoothedPoints: () => {},
};

const ControlsContext = createContext<Controls & { _isDefault?: true }>(defaultControls);

/**
 * Provide shared control state for descendant visualisation components.
 *
 * Wrap `PanelDisplay` with this provider to enable geography filtering and
 * display toggles such as logit mode and raw-frequency visibility.
 * Such controls apply to all Panels rendered with this shared control state.
 *
 * @example
 * ```tsx
 * <ControlsProvider>
 *   <PanelDisplay data={data} params={{ preset: "frequency" }} />
 * </ControlsProvider>
 * ```
 */
export function ControlsProvider({ children }: { children: ReactNode }) {
  const controls = useControls();
  return (
    <ControlsContext.Provider value={controls}>
      {children}
    </ControlsContext.Provider>
  );
}

export function useControlsContext(): Controls {
  const controls = useContext(ControlsContext);
  if ('_isDefault' in controls) {
    console.error("useControlsContext was called outside of a <ControlsProvider>. Interactivity will not work properly.");
  }
  return controls;
}
