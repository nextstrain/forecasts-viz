import { useState, useCallback, useMemo } from 'react';

export type ChangeVariantAction = 'set' | 'append' | 'unset';
export type ChangeVariant = (variant: string, action: ChangeVariantAction) => void;

export type SelectedLocations = string[];
export type ChangeLocations = (locations: SelectedLocations) => void;

export interface Controls {
  changeVariant: ChangeVariant;
  selectedVariants: Set<string>;
  changeLocations: ChangeLocations;
  selectedLocations: SelectedLocations;
  logit: boolean;
  toggleLogit: () => void;
  showDailyRawFreq: boolean;
  toggleShowDailyRawFreq: () => void;
  showWeeklyRawFreq: boolean;
  toggleShowWeeklyRawFreq: () => void;
}

export function useControls(): Controls {
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [selectedLocations, setSelectedLocations] = useState<SelectedLocations>([]);
  const [logit, setLogit] = useState(false);
  const [showDailyRawFreq, setShowDailyRawFreq] = useState(false);
  const [showWeeklyRawFreq, setShowWeeklyRawFreq] = useState(false);

  const changeVariant = useCallback<ChangeVariant>((variant, action) => {
    setSelectedVariants((prev) => {
      switch (action) {
        case 'set':
          return new Set([variant]);
        case 'append':
          return new Set(prev).add(variant);
        case 'unset': {
          const next = new Set(prev);
          next.delete(variant);
          return next;
        }
      }
    });
  }, []);
  
  const changeLocations = useCallback<ChangeLocations>(
    (locations) => setSelectedLocations(locations),
    []);
  const toggleLogit = useCallback(() => setLogit(prev => !prev), []);
  const toggleShowDailyRawFreq = useCallback(() => setShowDailyRawFreq(prev => !prev), []);
  const toggleShowWeeklyRawFreq = useCallback(() => setShowWeeklyRawFreq(prev => !prev), []);

  return useMemo(
    () => ({
      changeVariant,
      selectedVariants,
      selectedLocations,
      changeLocations,
      logit,
      toggleLogit,
      showDailyRawFreq,
      toggleShowDailyRawFreq,
      showWeeklyRawFreq,
      toggleShowWeeklyRawFreq,
    }),
    [
      changeVariant,
      selectedVariants,
      selectedLocations,
      changeLocations,
      logit,
      toggleLogit,
      showDailyRawFreq,
      toggleShowDailyRawFreq,
      showWeeklyRawFreq,
      toggleShowWeeklyRawFreq
    ]
  );
}