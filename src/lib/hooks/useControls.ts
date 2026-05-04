import { useState, useCallback, useMemo } from 'react';

export type ChangeVariantAction = 'set' | 'append' | 'unset';
export type ChangeVariant = (variant: string, action: ChangeVariantAction) => void;
export type SetVariantsFromFilter = (variants: string[]) => void;

/** each geography is category, then name.
 * Examples: ['location', 'Italy'] or ['Region', 'Europe']
 */
export type SelectedGeographies = [string, string][];
export type ChangeGeoFilters = (locations: SelectedGeographies) => void;

export interface Controls {
  changeVariant: ChangeVariant;
  setVariantsFromFilter: SetVariantsFromFilter;
  selectedVariants: Set<string>;
  changeGeoFilters: ChangeGeoFilters;
  selectedGeographies: SelectedGeographies;
  logit: boolean;
  toggleLogit: () => void;
  rawPoints: boolean;
  toggleRawPoints: () => void;
  smoothedPoints: boolean;
  toggleSmoothedPoints: () => void;
}

export function useControls(): Controls {
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());
  const [selectedGeographies, setSelectedGeographies] = useState<SelectedGeographies>([]);
  const [logit, setLogit] = useState(false);
  const [rawPoints, setRawPoints] = useState(false);
  const [smoothedPoints, setSmoothedPoints] = useState(false);

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

  const setVariantsFromFilter = useCallback<SetVariantsFromFilter>((variantNames) => {
    setSelectedVariants(new Set(variantNames));
  }, []);
  
  const changeGeoFilters = useCallback<ChangeGeoFilters>(
    (values) => {
      // filters can operate on locations themselves or on hierarchical groups
      setSelectedGeographies(values)
    },
    []);
  const toggleLogit = useCallback(() => setLogit(prev => !prev), []);
  const toggleRawPoints = useCallback(() => {
    setRawPoints(prev => {
      if (!prev) setSmoothedPoints(false);
      return !prev;
    });
  }, []);
  const toggleSmoothedPoints = useCallback(() => {
    setSmoothedPoints(prev => {
      if (!prev) setRawPoints(false);
      return !prev;
    });
  }, []);

  return useMemo(
    () => ({
      changeVariant,
      setVariantsFromFilter,
      selectedVariants,
      selectedGeographies,
      changeGeoFilters,
      logit,
      toggleLogit,
      rawPoints,
      toggleRawPoints,
      smoothedPoints,
      toggleSmoothedPoints,
    }),
    [
      changeVariant,
      setVariantsFromFilter,
      selectedVariants,
      selectedGeographies,
      changeGeoFilters,
      logit,
      toggleLogit,
      rawPoints,
      toggleRawPoints,
      smoothedPoints,
      toggleSmoothedPoints
    ]
  );
}