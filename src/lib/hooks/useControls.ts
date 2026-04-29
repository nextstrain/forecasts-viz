import { useState, useCallback, useMemo } from 'react';

export type ChangeVariantAction = 'set' | 'append' | 'unset';
export type ChangeVariant = (variant: string, action: ChangeVariantAction) => void;

/** each geography is category, then name.
 * Examples: ['location', 'Italy'] or ['Region', 'Europe']
 */
export type SelectedGeographies = [string, string][];
export type ChangeGeoFilters = (locations: SelectedGeographies) => void;

export interface Controls {
  changeVariant: ChangeVariant;
  selectedVariants: Set<string>;
  changeGeoFilters: ChangeGeoFilters;
  selectedGeographies: SelectedGeographies;
  logit: boolean;
  toggleLogit: () => void;
  showDailyRawFreq: boolean;
  toggleShowDailyRawFreq: () => void;
  showWeeklyRawFreq: boolean;
  toggleShowWeeklyRawFreq: () => void;
}

export function useControls(): Controls {
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [selectedGeographies, setSelectedGeographies] = useState<SelectedGeographies>([]);
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
  
  const changeGeoFilters = useCallback<ChangeGeoFilters>(
    (values) => {
      // filters can operate on locations themselves or on hierarchical groups
      setSelectedGeographies(values)
    },
    []);
  const toggleLogit = useCallback(() => setLogit(prev => !prev), []);
  const toggleShowDailyRawFreq = useCallback(() => setShowDailyRawFreq(prev => !prev), []);
  const toggleShowWeeklyRawFreq = useCallback(() => setShowWeeklyRawFreq(prev => !prev), []);

  return useMemo(
    () => ({
      changeVariant,
      selectedVariants,
      selectedGeographies,
      changeGeoFilters,
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
      selectedGeographies,
      changeGeoFilters,
      logit,
      toggleLogit,
      showDailyRawFreq,
      toggleShowDailyRawFreq,
      showWeeklyRawFreq,
      toggleShowWeeklyRawFreq
    ]
  );
}