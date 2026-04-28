import React, { createContext, useContext, ReactNode } from 'react';
import { useControls, Controls } from './useControls';

const defaultControls: Controls & { _isDefault?: true } = {
  _isDefault: true,
  changeVariant: () => {},
  selectedVariants: new Set(),
  selectedLocations: [],
  changeLocations: () => {},
  logit: false,
  toggleLogit: () => {},
  showDailyRawFreq: false,
  toggleShowDailyRawFreq: () => {},
  showWeeklyRawFreq: false,
  toggleShowWeeklyRawFreq: () => {},
};

const ControlsContext = createContext<Controls & { _isDefault?: true }>(defaultControls);

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
