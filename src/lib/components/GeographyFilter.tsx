import React from 'react';
import Select from 'react-select';
import { Controls }  from "../hooks/useControls"
import { DatasetConfig } from "../utils/config.ts";
import { ModelData } from "../utils/modelData.types.ts"

export const GeographyFilter = ({
  modelLocations,
  modelLocationHierarchy,
  selectedGeographies,
  changeGeoFilters
}: {
  modelLocations: string[],
  modelLocationHierarchy: DatasetConfig['locationHierarchy']
  selectedGeographies: Controls['selectedGeographies'],
  changeGeoFilters: Controls['changeGeoFilters'],
}) => {
  /**
   * Options are built from model locations (i.e. one location per graph)
   * and any location hierarchies defined in the config/model
   */
  const options = [
    ...modelLocations.map((loc) => ({ value: ['location', loc] as [string, string], label: _label('location', loc) })),
    ...[...modelLocationHierarchy?.keys() || []].flatMap((category) => {
      return [...modelLocationHierarchy.get(category).keys()].map((name) => {
        return { value: [category, name] as [string, string], label: _label(category, name) }
      })
    })
  ];
  const selection = selectedGeographies.map((value) => (
    {value, label: _label(...value)}
  ))
  return (
    <div className='toggle'>
      <span style={{paddingTop: 10}}>
        Locations:
      </span>
      <Select
        value={selection}
        isMulti
        name="locations"
        options={options}
        className="basic-multi-select"
        classNamePrefix="select"
        styles={{ container: (base) => ({ ...base, paddingLeft: 10, minWidth: 400, maxWidth: 400 }) }}
        onChange={(selected) => changeGeoFilters(selected ? selected.map((s) => s.value) : [])}
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

