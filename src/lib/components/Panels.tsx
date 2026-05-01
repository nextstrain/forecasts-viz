import React from 'react';
import { useElementSize, useDebounce } from 'usehooks-ts';
import { Legend } from "./Legend.tsx";
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { ErrorMessage } from "./ErrorMessage.tsx";
import Spinner from "./Spinner.tsx";
import { Toggle } from "./Toggle.tsx";
import { Graph } from "./Graph.tsx";
import { useControlsContext } from "../hooks/ControlsContext";
import { ModelDataWrapper } from "../utils/useModelData.ts";
import { filterLocations, GeographyFilter } from "./GeographyFilter.tsx"
import type { UserGraphParams, GraphParams } from "../utils/graphParams.ts";
import { expandParams } from "../utils/graphParams.ts";

import "../styles/styles.css";


type SmallMultipleStyles = any; // todo: define the shared small-multiple sizing type

interface ResponsiveSizingResult {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
  legendRadius: number;
  outerWidth: number;
}

interface PanelProps {
  data: ModelDataWrapper;
  params: UserGraphParams;
  styles?: SmallMultipleStyles;
  locations?: string[] | undefined;
}

/**
 * This function should handle all styling parameters related to sizing -- graph sizes,
 * legend sizes, text sizes etc. It is a work in progress. All styles defined here can be
 * overridden by props from the parent component.
 * @private 
 */
const responsiveSizing = (
  params: GraphParams,
  modelData: ModelDataWrapper['modelData'],
  dimensions: { width: number },
  locationList: string[],
): ResponsiveSizingResult => {

  const outerWidth = dimensions.width;

  const numVariants = modelData?.get('variants')?.length;

  let legendRadius = 8;

  /** width/heights are in pixels (as they'll be used in the SVG).
   * We try to make some sensible decisions about these widths
   * depending on the data & window sizes
   */
  let width = 260;
  let height = params.preset==="growthAdvantage" ? 230 : 210;

  /* If there's only 1 or 2 locations make each full width */
  if (locationList?.length<3) {
    width = outerWidth - 20 // outer div allowing for some margin
  }

  /* If growthAdvantage and lineages, always use full width */
  if (params.preset==="growthAdvantage" && numVariants > 20) {
    width = outerWidth - 20 // outer div allowing for some margin
  }

  /* control the spacing around graphs via the margin of each graph
  We export these as individual keys so they can be easily overridden.
  The initial ones are generally ok. */
  let [top, right, bottom, left] = [15, 10, 35, 45];
  if (params.preset==="growthAdvantage") {
    [top, right, bottom, left] = [15, 40, 70, 40];
  }

  return {
    width, height,
    top, right, bottom, left,
    legendRadius,
    outerWidth
  };
}


/**
 * Render a panel of small-multiple graphs for the currently selected locations.
 *
 * Pass the {@link ModelDataWrapper} returned by `useModelData` as the `data`
 * prop. The `params` prop selects which graph preset or graph definition to
 * render, and `styles` can override the default sizing used for each graph.
 *
 * @remarks
 * This component reads its interactive state from {@link ControlsProvider}.
 * Render it inside that provider if you want geography filters and display
 * toggles to work correctly.
 *
 * The `locations` prop is deprecated. Prefer dataset configuration and shared
 * controls state to determine which locations are shown.
 *
 * @example
 * ```tsx
 * <PanelDisplay data={data} params={{ preset: "frequency" }} />
 * ```
 * @example
 * ```tsx
 * <PanelDisplay
 *   data={data}
 *   params={{
 *     graphType: "lines",
 *     key: "I_smooth",
 *     interval: ["I_smooth_HDI_95_lower", "I_smooth_HDI_95_upper"],
 *     intervalOpacity: 0.3,
 *     yDomain: getDomainUsingKey("I_smooth_HDI_95_upper"),
 *     tooltipXY: displayTopVariants(),
 *   }}
 * />
 * ```
 * @example
 * ```tsx
 * <PanelDisplay
 *   data={data}
 *   styles={{ height: 300, width: 400 }}
 *   params={{ preset: "stackedIncidence" }}
 * />
 * ```
 */
export const PanelDisplay = ({
  data,
  params,
  styles,
  locations,
}: {
  data: ModelDataWrapper;
  params: UserGraphParams;
  styles?: SmallMultipleStyles;
  locations?: string[] | undefined;
}) => {
  return (
    <ErrorBoundary>
      <Panel
        data={data}
        params={params}
        styles={styles}
        locations={locations}
      />
    </ErrorBoundary>
  )
}

/**
 * See <PanelDisplay> for description. That component wraps this one
 * so that if any hooks have errors they bubble up and can be caught
 * @private 
 */
const Panel = ({
  data,
  params,
  styles = undefined,
  
  /** Deprecated! */
  locations=undefined, /* optional. Defaults to all available */
}: PanelProps) => {
  const {modelData, error} = data;
  const {selectedGeographies, changeGeoFilters, logit, toggleLogit, showDailyRawFreq, toggleShowDailyRawFreq, showWeeklyRawFreq, toggleShowWeeklyRawFreq} = useControlsContext();

  const expandedParams = expandParams(params);
  
  if (locations) {
    console.warn("Deprecation: <Panel> no longer takes a 'locations' prop")
  }

  const [outerDivRef, _dimensions] = useElementSize()
  const dimensions = useDebounce(_dimensions, 500);  
  const locationList = filterLocations(modelData, selectedGeographies);
  const sizes = {...responsiveSizing(expandedParams, modelData, dimensions, locationList), ...(styles ? styles : {})};
  const canUseLogit = expandedParams.canUseLogit;
  // Note: following lines hardcode 'freq'
  const showRawPoints = expandedParams.showRawPoints && modelData?.get('config').sitesInfo?.freq?.raw_site;
  const showSmoothedPoints = expandedParams.showSmoothedPoints && modelData?.get('config').sitesInfo?.freq?.smoothed_site;
  
  if (error) {
    return (<ErrorMessage error={error}/>);
  }

  if (!modelData) {
    return <Spinner/>
  }

  return (
    <div className='panelContainer' ref={outerDivRef}>
      <div className='optionsContainer'>
        <GeographyFilter
          modelLocations={modelData.get('locations') || []}
          modelLocationHierarchy={modelData.get('locationHierarchy') || new Map()}
          selectedGeographies={selectedGeographies}
          changeGeoFilters={changeGeoFilters}
        />
        <div className='togglesContainer'>
          {canUseLogit && <Toggle label="Logit transform" checked={logit} onChange={toggleLogit}/>}
          {showRawPoints && <Toggle label={modelData.get('config').sitesInfo.freq.raw_name || "Weekly raw data"} checked={showDailyRawFreq} onChange={toggleShowDailyRawFreq}/>}
          {showSmoothedPoints && <Toggle label={modelData.get('config').sitesInfo.freq.smoothed_name || "Weekly raw data"} checked={showWeeklyRawFreq} onChange={toggleShowWeeklyRawFreq}/>}
        </div>
      </div>

      <div className='legendAndSmallMultiplesContainer'>
        <Legend modelData={modelData} sizes={sizes} preset={expandedParams.preset}/>
        <div className='smallMultiplesContainer'
          style={{gridTemplateColumns: `repeat(auto-fill, minmax(${sizes.width}px, 1fr))`}}>
          {locationList
            .map((location) => (
              <Graph
                modelData={modelData}
                sizes={sizes}
                location={location}
                params={expandedParams}
                key={`${expandedParams.preset || expandedParams.key}_${location}`}
              />
            ))
          }
        </div>
      </div>
    </div>
  )
}
