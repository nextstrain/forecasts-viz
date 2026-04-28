import { useState, useCallback, useMemo } from 'react';

export type ChangeVariantAction = 'set' | 'append' | 'unset';
export type ChangeVariant = (variant: string, action: ChangeVariantAction) => void;

export interface Controls {
  changeVariant: ChangeVariant;

  selectedVariants: Set<string>
}

export function useControls(): Controls {
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

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

  return useMemo(
    () => ({ changeVariant, selectedVariants }),
    [changeVariant, selectedVariants]
  );
}