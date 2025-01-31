<a name="module_@nextstrain/evofr-viz"></a>

## @nextstrain/evofr-viz

* [@nextstrain/evofr-viz](#module_@nextstrain/evofr-viz)
    * _static_
        * [.exports.PanelDisplay](#module_@nextstrain/evofr-viz.exports.PanelDisplay)
        * [.exports.useModelData](#module_@nextstrain/evofr-viz.exports.useModelData) ⇒ <code>ModelDataWrapper</code>
    * _inner_
        * [~GraphParameters](#module_@nextstrain/evofr-viz..GraphParameters) : <code>Object</code>
        * [~TimePoint](#module_@nextstrain/evofr-viz..TimePoint) : <code>Map</code>
        * [~VariantPoint](#module_@nextstrain/evofr-viz..VariantPoint) : <code>Map</code>
        * [~ModelData](#module_@nextstrain/evofr-viz..ModelData) : <code>Map</code>
        * [~ModelDataWrapper](#module_@nextstrain/evofr-viz..ModelDataWrapper) : <code>Object</code>
        * [~DatasetConfig](#module_@nextstrain/evofr-viz..DatasetConfig) : <code>Object</code>

<a name="module_@nextstrain/evofr-viz.exports.PanelDisplay"></a>

### evofr.exports.PanelDisplay
Display a panel of small-multiple graphs for different locations.
This component should be provided data obtained via the `useModelData` hook.
The `params` prop defines the graphs to be drawn.
The `styles` prop defines any style overrides to the graphs.
The `locations` prop allows you to define a subset of locations for which to draw graphs.

**Kind**: static React Component of [<code>@nextstrain/evofr-viz</code>](#module_@nextstrain/evofr-viz)

| Param | Type | Description |
| --- | --- | --- |
| data | <code>ModelDataWrapper</code> | see `useModelData` |
| params | <code>GraphParameters</code> |  |
| styles | <code>SmallMultipleStyles</code> |  |
| locations | <code>Array</code> \| <code>undefined</code> | default (`undefined`) displays all available locations |

**Example**
```js
// typical usage is to use a preset graph type
<PanelDisplay data={...} params={{preset: "frequency"}}/>
```
**Example**
```js
// an example of defining the params yourself
// this will create a temporal line graph using the `I_smooth` key
<PanelDisplay data={...} params={{
  graphType: "lines",
  key: 'I_smooth',
  interval:  ['I_smooth_HDI_95_lower', 'I_smooth_HDI_95_upper'],
  intervalOpacity: 0.3,
  yDomain: getDomainUsingKey('I_smooth_HDI_95_upper'),
  tooltipXY: displayTopVariants(),
}}/>
```
**Example**
```js
// custom styling can be provided which is applied to each small-multiple
<PanelDisplay data={...}
   styles={{height: 300, width: 400}}
   params={{preset: "stackedIncidence"}}
/>
```
<a name="module_@nextstrain/evofr-viz.exports.useModelData"></a>

### evofr.exports.useModelData ⇒ <code>ModelDataWrapper</code>
Fetch and parse the model data (JSON).
See the `config` type definition to understand the expected options.
This returns an object containing the modelData (type: `modelData`) and
any error messages. If an error is encountered we also print this to the
console (`console.error()`).
The return value is designed to be passed to a <PanelDisplay> component's
as its `data` prop.

Warning: Ensure the config object is not (re-)created within your react
component, as this will trigger a re-fetch of the data and subsequent
re-rendering of the graphs.

**Kind**: static constant of [<code>@nextstrain/evofr-viz</code>](#module_@nextstrain/evofr-viz)

| Param | Type |
| --- | --- |
| config | <code>DatasetConfig</code> |

**Example**
```js
const mlrData = useModelData(
  modelName: "MLR",
  modelUrl: "https://nextstrain-data.s3.amazonaws.com/files/workflows/forecasts-ncov/gisaid/nextstrain_clades/global/mlr/latest_results.json"
);
```
<a name="module_@nextstrain/evofr-viz..GraphParameters"></a>

### @nextstrain/evofr-viz~GraphParameters : <code>Object</code>
Configuration for how a graph is to be visualised. All/any of these properties may be set by
the <PanelDisplay> component. If a preset is set then it will be expanded into a meaningful
set of these properties (see `expandParams()`).

Note that a deep equality check will be used to decide when (if) the params for an individual
small-multiple have changes and the graph should therefore re-draw. Because functions are
compared by reference you must memoize any functions or provide a consistent reference to them.
A common case to avoid is defining the function within a react component (or within the prop
declaration), as that function will be re-created each time the component renders.

**Kind**: inner typedef of [<code>@nextstrain/evofr-viz</code>](#module_@nextstrain/evofr-viz)
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [preset] | <code>&quot;stackedIncidence&quot;</code> \| <code>&quot;R\_t&quot;</code> \| <code>&quot;growthAdvantage&quot;</code> \| <code>&quot;frequency&quot;</code> | Load a set of preset parameters. Any parameters re-defined here will overwrite those which come from the preset. |
| [graphType] | <code>&quot;points&quot;</code> \| <code>&quot;lines&quot;</code> \| <code>&quot;stream&quot;</code> |  |
| [key] | <code>String</code> |  |
| [interval] | <code>Array.&lt;String&gt;</code> |  |
| [intervalOpacity] | <code>Number</code> |  |
| [intervalStrokeWidth] | <code>Number</code> |  |
| [dashedLines] | <code>Array.&lt;Number&gt;</code> | horizontal dashed lines |
| [xDomain] | <code>function</code> \| <code>Array</code> | Function's `this` gives access to properties on the D3Graph instance |
| [yDomain] | <code>function</code> \| <code>Array.&lt;Number&gt;</code> | Function's `this` gives access to properties on the D3Graph instance |
| [forecastLine] | <code>Boolean</code> |  |
| [yTickFmt] | <code>function</code> |  |
| [tooltipPt] | <code>function</code> | Function to return HTML when tooltip is attached to a point. |
| [tooltipXY] | <code>function</code> | Function to return HTML when tooltip is over any part of the graph. |

<a name="module_@nextstrain/evofr-viz..TimePoint"></a>

### @nextstrain/evofr-viz~TimePoint : <code>Map</code>
An data point representing a model estimate at a certain date
Extra keys (e.g. "freq") are added in a data-dependent manner.
Note that key suffixes _forecast are removed - i.e. a point associated
with "freq_forecast" is stores under the "freq" key in this Map.

**Kind**: inner typedef of [<code>@nextstrain/evofr-viz</code>](#module_@nextstrain/evofr-viz)
**Properties**

| Name | Type |
| --- | --- |
| date | <code>string</code> \| <code>undefined</code> |

<a name="module_@nextstrain/evofr-viz..VariantPoint"></a>

### @nextstrain/evofr-viz~VariantPoint : <code>Map</code>
An data point representing a model estimate for a variant.
The keys defined directly here are not specific to any date.
Date-specific estimates are specified via `temporal`
Extra keys (e.g. "ga") are added in a data-dependent manner.

**Kind**: inner typedef of [<code>@nextstrain/evofr-viz</code>](#module_@nextstrain/evofr-viz)
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| variant | <code>string</code> \| <code>undefined</code> | Variant name |
| temporal | <code>Array</code> \| <code>undefined</code> | Array of `TimePoint` estimates |

<a name="module_@nextstrain/evofr-viz..ModelData"></a>

### @nextstrain/evofr-viz~ModelData : <code>Map</code>
Currently this Map represents the model data in its entirety and
is generated ahead of time via the `useModelData` hook. This may change
to a structure where the points, domains etc are generated by the
visualisation component in the future. See NOTES.md for more.

**Kind**: inner typedef of [<code>@nextstrain/evofr-viz</code>](#module_@nextstrain/evofr-viz)
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| points | <code>Points</code> |  |
| variants | <code>Array</code> | modelJson.metadata.variants |
| dates | <code>Array</code> | sorted array of YYYY-MM-DD dates, guaranteed not to have any holes.                         These dates bridge both `modelJson.metadata.dates` and `modelJson.metadata.forecast_dates`. |
| locations | <code>Array</code> | modelJson.metadata.location |
| dateIdx | <code>Map</code> | lookup for date string -> idx in dates array |
| variantColors | <code>Map</code> | provided via `DatasetConfig`. Overrides data set in the JSON. Default colors set if not provided. |
| variantDisplayNames | <code>Map</code> | provided via `DatasetConfig`. Overrides data set in the JSON. Keys used if not provided. |
| pivot | <code>String</code> | Currently the final entry in the model's list of variants |
| nowcastFinalDate | <code>string</code> |  |
| updated | <code>string</code> |  |
| domains | <code>Object</code> |  |

<a name="module_@nextstrain/evofr-viz..ModelDataWrapper"></a>

### @nextstrain/evofr-viz~ModelDataWrapper : <code>Object</code>
**Kind**: inner typedef of [<code>@nextstrain/evofr-viz</code>](#module_@nextstrain/evofr-viz)
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| modelData | <code>ModelData</code> \| <code>undefined</code> |  |
| error | <code>String</code> \| <code>undefined</code> | Errors encountered during JSON fetch / parse |

<a name="module_@nextstrain/evofr-viz..DatasetConfig"></a>

### @nextstrain/evofr-viz~DatasetConfig : <code>Object</code>
Configuration for the datasets to fetch & parse
Currently the library is only built for `forecasts-ncov` model data
and so there are hardcoded expectations. These will be lifted up and
made config-options so that this library is pathogen agnostic.

**Kind**: inner typedef of [<code>@nextstrain/evofr-viz</code>](#module_@nextstrain/evofr-viz)
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| modelName | <code>string</code> | Name of the model - used to improve clarity of error messages |
| modelUrl | <code>string</code> | Address to fetch the model JSON from |
| [sites] | <code>Set</code> | list of sites to extract from JSON.                         If not provided we will use the sites set in the JSON metadata. |
| [variantColors] | <code>Map.&lt;string, string&gt;</code> | colors for the variants specified in the model JSONs.                                                A default colour scale is available. |
| [variantDisplayNames] | <code>Map.&lt;string, string&gt;</code> | display names for the variants specified in the model JSONs.                                                       If not provided we use the keys as names. |
