import React from 'react';
import Select from 'react-select';
import { Controls }  from "../hooks/useControls"
import { DatasetConfig } from "../utils/config.ts";
import { ModelData } from "../utils/modelData.types.ts"

type FilterOption = { value: [string, string], label: string };
type FilterGroup = { label: string, options: FilterOption[] };

export const Filter = ({
  modelLocations,
  modelLocationHierarchy,
  selectedGeographies,
  changeGeoFilters,
  variants,
  variantDisplayNames,
  selectedVariants,
  setVariantsFromFilter,
}: {
  modelLocations: string[],
  modelLocationHierarchy: DatasetConfig['locationHierarchy']
  selectedGeographies: Controls['selectedGeographies'],
  changeGeoFilters: Controls['changeGeoFilters'],
  variants: string[],
  variantDisplayNames: Map<string, string>,
  selectedVariants: Controls['selectedVariants'],
  setVariantsFromFilter: Controls['setVariantsFromFilter'],
}) => {
  const locationOptions: FilterOption[] = [
    ...modelLocations.map((loc) => ({ value: ['location', loc] as [string, string], label: _label('location', loc) })),
    ...[...modelLocationHierarchy?.keys() || []].flatMap((category) => {
      return [...modelLocationHierarchy.get(category).keys()].map((name) => {
        return { value: [category, name] as [string, string], label: _label(category, name) }
      })
    })
  ];

  const variantOptions: FilterOption[] = variants.map((v) => ({
    value: ['variant', v] as [string, string],
    label: variantDisplayNames.get(v) || v,
  }));

  const groupedOptions: FilterGroup[] = [
    { label: 'Locations', options: locationOptions },
    { label: 'Variants', options: variantOptions },
  ];

  const value: FilterOption[] = [
    ...selectedGeographies.map((geo) => ({ value: geo, label: _label(...geo) })),
    ...Array.from(selectedVariants).map((v) => ({
      value: ['variant', v] as [string, string],
      label: variantDisplayNames.get(v) || v,
    })),
  ];

  return (
    <div className='toggle'>
      <span style={{paddingTop: 10}}>
        Filters:
      </span>
      <Select<FilterOption, true, FilterGroup>
        value={value}
        isMulti
        name="filters"
        options={groupedOptions}
        className="basic-multi-select"
        classNamePrefix="select"
        getOptionValue={(opt) => `${opt.value[0]}::${opt.value[1]}`}
        styles={{ container: (base) => ({ ...base, paddingLeft: 10, minWidth: 400, maxWidth: 500 }) }}
        onChange={(selected) => {
          const items = selected ? [...selected] : [];
          const newGeos = items.filter((s) => s.value[0] !== 'variant').map((s) => s.value);
          const newVariants = items.filter((s) => s.value[0] === 'variant').map((s) => s.value[1]);
          changeGeoFilters(newGeos);
          setVariantsFromFilter(newVariants);
        }}
      />
    </div>
  )
}

/** generate the display label shown in the select dropdown component */
function _label(category: string, name: string): string {
  if (category === 'location') return name;
  return `${category}: ${name}`;
}

export function filterLocations(
  modelData: ModelData,
  selectedGeographies: Controls['selectedGeographies']
): string[] {
  const locations: string[] = (modelData?.get('locations') || []);
  const filteredLocations: Set<string> = new Set(selectedGeographies.flatMap(([category, value]) => {
    if (category === 'location') return value;
    const locationHierarchy = modelData.get('locationHierarchy') || new Map()
    const categoryMap = locationHierarchy.get(category)
    if (!categoryMap) {
      console.error(`[INTERNAL ERROR] unknown locationHierarchy ${category}`)
      return [];
    }
    const locs = categoryMap.get(value);
    if (!Array.isArray(locs)) {
      console.error(`[INTERNAL ERROR] locationHierarchy.${category}.${value} is not an array`)
      return [];
    }
    return locs;
  }));
  return filteredLocations.size ?
    locations.filter((loc) => filteredLocations.has(loc)) : // ensures ordering maintained
    locations;
}

