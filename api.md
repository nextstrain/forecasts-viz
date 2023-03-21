<a name="module_@nextstrain/forecasts-viz"></a>

## @nextstrain/forecasts-viz

* [@nextstrain/forecasts-viz](#module_@nextstrain/forecasts-viz)
    * _static_
        * _Components_
            * [.exports.ModelDataProvider](#module_@nextstrain/forecasts-viz.exports.ModelDataProvider)
            * [.exports.PanelDisplay](#module_@nextstrain/forecasts-viz.exports.PanelDisplay)
            * [.exports.ModelDataStatus](#module_@nextstrain/forecasts-viz.exports.ModelDataStatus)
        * _Hooks_
            * [.exports.useModelData](#module_@nextstrain/forecasts-viz.exports.useModelData) ⇒ <code>ContextData</code>
    * _inner_
        * [~ContextData](#module_@nextstrain/forecasts-viz..ContextData) : <code>Object</code>
        * [~DatasetConfig](#module_@nextstrain/forecasts-viz..DatasetConfig) : <code>Object</code>
        * [~TimePoint](#module_@nextstrain/forecasts-viz..TimePoint) : <code>Map</code>
        * [~VariantPoint](#module_@nextstrain/forecasts-viz..VariantPoint) : <code>Map</code>
        * [~ModelData](#module_@nextstrain/forecasts-viz..ModelData) : <code>Map</code>

<a name="module_@nextstrain/forecasts-viz.exports.ModelDataProvider"></a>

### forecastsViz.exports.ModelDataProvider
A React component which fetches and parses forecast-model JSONs
and exposes them via React context. This data can be accessed by
using the `useModelData` hook. All display content which wants to
use this data (e.g. panels) should be children of this component.

**Kind**: static React Component of [<code>@nextstrain/forecasts-viz</code>](#module_@nextstrain/forecasts-viz)  
**Category**: Components  

| Param | Type | Description |
| --- | --- | --- |
| config | <code>DatasetConfig</code> | Configuration of datasets |
| children | <code>ReactComponent</code> | Child react components for rendering |

**Example**  
```js
<ModelDataProvider ...>
  <PanelDisplay.../>
</ModelDataProvider
```
<a name="module_@nextstrain/forecasts-viz.exports.PanelDisplay"></a>

### forecastsViz.exports.PanelDisplay
Display a panel of small-multiple graphs for different locations.
This component must be a descendent of a `<ModelDataProvider>`

**Kind**: static React Component of [<code>@nextstrain/forecasts-viz</code>](#module_@nextstrain/forecasts-viz)  
**Category**: Components  

| Param | Type | Description |
| --- | --- | --- |
| graphType | <code>&#x27;growthAdvantage&#x27;</code> \| <code>&#x27;r\_t&#x27;</code> \| <code>&#x27;frequency&#x27;</code> \| <code>&#x27;stackedIncidence&#x27;</code> |  |
| locations | <code>Array</code> \| <code>undefined</code> | Defaults to `undefined` which will display all available locations |

**Example**  
```js
<PanelDisplay graphType="ga"/>
```
<a name="module_@nextstrain/forecasts-viz.exports.ModelDataStatus"></a>

### forecastsViz.exports.ModelDataStatus
A React component which displays the status of the model data being
fetched and parsed by `ModelDataProvider`. Once the data has been
(successfully) parsed this component will return `null` and thus
not render any elements to screen. If you wish to have custom display
of progress then it's easy to write your own component which considers
the `status` and `error` properties of `useModelData()`

**Kind**: static React Component of [<code>@nextstrain/forecasts-viz</code>](#module_@nextstrain/forecasts-viz)  
**Category**: Components  
**Example**  
```js
<ModelDataProvider ...>
  <ModelDataStatus/>
</ModelDataProvider
```
<a name="module_@nextstrain/forecasts-viz.exports.useModelData"></a>

### forecastsViz.exports.useModelData ⇒ <code>ContextData</code>
Accesses data provided by `<ModelDataProvider>`

**Kind**: static React Hook of [<code>@nextstrain/forecasts-viz</code>](#module_@nextstrain/forecasts-viz)  
**Returns**: <code>ContextData</code> - The data provided by `<ModelDataProvider>`  
**Category**: Hooks  
**Throws**:

- Error

**Example**  
```js
const MyReactComponent = ({}) => {
  const {modelData, status, error} = useModelData();
  ...
}
```
<a name="module_@nextstrain/forecasts-viz..ContextData"></a>

### @nextstrain/forecasts-viz~ContextData : <code>Object</code>
The data made available via React Context

**Kind**: inner typedef of [<code>@nextstrain/forecasts-viz</code>](#module_@nextstrain/forecasts-viz)  
**Properties**

| Name | Type |
| --- | --- |
| modelData | <code>ModelData</code> \| <code>undefined</code> | 
| status | <code>string</code> | 
| error | <code>Error</code> \| <code>undefined</code> | 

<a name="module_@nextstrain/forecasts-viz..DatasetConfig"></a>

### @nextstrain/forecasts-viz~DatasetConfig : <code>Object</code>
Configuration for the datasets to fetch & parse
Currently the library is only built for `forecasts-ncov` model data
and so there are hardcoded expectations. These will be lifted up and
made config-options so that this library is pathogen agnostic.

**Kind**: inner typedef of [<code>@nextstrain/forecasts-viz</code>](#module_@nextstrain/forecasts-viz)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| mlrUrl | <code>string</code> | Address to fetch the MLR model JSON |
| renewalUrl | <code>string</code> | Address to fetch the Renewal model JSON |
| variantColors | <code>Map.&lt;string, string&gt;</code> | colors for the variants specified in the model JSONs |
| variantDisplayNames | <code>Map.&lt;string, string&gt;</code> | display names for the variants specified in the model JSONs |

<a name="module_@nextstrain/forecasts-viz..TimePoint"></a>

### @nextstrain/forecasts-viz~TimePoint : <code>Map</code>
An data point representing a model estimate at a certain date

**Kind**: inner typedef of [<code>@nextstrain/forecasts-viz</code>](#module_@nextstrain/forecasts-viz)  
**Properties**

| Name | Type |
| --- | --- |
| date | <code>string</code> \| <code>undefined</code> | 
| freq | <code>number</code> \| <code>NaN</code> | 
| I_smooth | <code>number</code> \| <code>NaN</code> | 
| I_smooth_y0 | <code>number</code> \| <code>NaN</code> | 
| I_smooth_y1 | <code>number</code> \| <code>NaN</code> | 
| r_t | <code>number</code> \| <code>NaN</code> | 

<a name="module_@nextstrain/forecasts-viz..VariantPoint"></a>

### @nextstrain/forecasts-viz~VariantPoint : <code>Map</code>
An data point representing a model estimate for a variant.
The properties defined directly here are not specific to any date.
Date-specific estimates are specified via `temporal`

**Kind**: inner typedef of [<code>@nextstrain/forecasts-viz</code>](#module_@nextstrain/forecasts-viz)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| variant | <code>string</code> \| <code>undefined</code> | Variant name |
| ga | <code>number</code> \| <code>undefined</code> | Growth Advantage |
| temporal | <code>Array</code> \| <code>undefined</code> | Array of `TimePoint` estimates |

<a name="module_@nextstrain/forecasts-viz..ModelData"></a>

### @nextstrain/forecasts-viz~ModelData : <code>Map</code>
**Kind**: inner typedef of [<code>@nextstrain/forecasts-viz</code>](#module_@nextstrain/forecasts-viz)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| points | <code>Points</code> |  |
| variants | <code>Array</code> | (from renewal model) |
| dates | <code>Array</code> | (from renewal model, with some early dates removed) |
| locations | <code>Array</code> | (from renewal model) |
| dateIdx | <code>Map</code> | lookup for date string -> idx in dates array |
| variantColors | <code>Map</code> |  |
| variantDisplayNames | <code>Map</code> |  |
| pivot | <code>String</code> | (final entry in MLR model's list of variants) |
| dateIdx | <code>Map</code> |  |

