Assorted development notes and ideas.

## The react hooks - d3 interface

I took an approach which uses explicit dependency comparisons (new dependencies vs previous dependencies) and uses this information to call appropriate d3-funcitons (specifically our own functions, which themselves use d3).
For a specific set of prop differences (changes in dependencies) we call the associated d3 functions -- for instance changing the logit toggle calls `updateScale()`. For any other changes in props we tear down & re-render the entire SVG.
This approach involves a single hook (`useGraph()`).
A related implementation detail used here is that d3 data (e.g. scales), as well as references to data are held by the `D3Graph` object in order to reduce the passing around many arguments.


There is an alternative approach which uses a series of useEffect hooks, and uses their inbuilt dependency comparisons to choose the d3 function to triggger.
This is how [the measurements panel in auspice](https://github.com/nextstrain/auspice/blob/master/src/components/measurements/index.js#L129) is designed.

There are pros and cons to each approach. 


## Where should the data points in the JSON be parsed?

Our current approach parses the JSON -- including the metadata and the points themselves -- when loading the JSON (via the `useModelData()` hook).
This means the parsing of points -- e.g. `freq`, `R`, `ga` -- is decoupled from the visualisation component.
This is somewhat left-over from a previous version where we parsed multiple model JSONs at the same time and needed to ensure consistency between them.
As that requirement is no longer, I think it would make sense to defer the parsing of these points to the visualisation component itself.

This is especially pertinent now that the visualisation component can define which sites it should visualise (via the `params` prop).

## Forecasting date

This is currently taken as the final date in the 'dates' array, but this should be explicitly defined by them model JSON.

## Pivot variant

Currently we use last variant in the array, however this is soon to be explicitly provided in the model JSON.

## Responsive graph sizes

Currently the graphs widths/heights do not change.
This isn't a problem most of the time -- on bigger screens the grid design just adds more small-multiples to each row.
However there may be certain thresholds (e.g. mobile) where we do want to update these values, especially for the bigger graphs (e.g. for pango analyses).

