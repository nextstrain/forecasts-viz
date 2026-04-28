import React, { createContext, useContext, ReactNode } from 'react';
import { useControls, Controls } from './useControls';

/* Default value so consumers rendered outside a <ControlsProvider> still
   work — they just see an empty selection and a no-op changeVariant. */
const defaultControls: Controls = {
  changeVariant: () => {},
  selectedVariants: new Set(),
};

const ControlsContext = createContext<Controls>(defaultControls);

export function ControlsProvider({ children }: { children: ReactNode }) {
  const controls = useControls();
  return (
    <ControlsContext.Provider value={controls}>
      {children}
    </ControlsContext.Provider>
  );
}

export function useControlsContext(): Controls {
  return useContext(ControlsContext);
}
