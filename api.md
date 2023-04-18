<a name="module_@nextstrain/evofr-viz"></a>

## @nextstrain/evofr-viz

* [@nextstrain/evofr-viz](#module_@nextstrain/evofr-viz)
    * _static_
        * [.exports.PanelDisplay](#module_@nextstrain/evofr-viz.exports.PanelDisplay)
        * [.exports.useModelData](#module_@nextstrain/evofr-viz.exports.useModelData) ⇒ <code>ModelDataWrapper</code>
    * _inner_
        * [~TimePoint](#module_@nextstrain/evofr-viz..TimePoint) : <code>Map</code>
        * [~VariantPoint](#module_@nextstrain/evofr-viz..VariantPoint) : <code>Map</code>
        * [~ModelData](#module_@nextstrain/evofr-viz..ModelData) : <code>Map</code>
        * [~ModelDataWrapper](#module_@nextstrain/evofr-viz..ModelDataWrapper) : <code>Object</code>
        * [~DatasetConfig](#module_@nextstrain/evofr-viz..DatasetConfig) : <code>Object</code>

<a name="module_@nextstrain/evofr-viz.exports.PanelDisplay"></a>

### evofr.exports.PanelDisplay
Display a panel of small-multiple graphs for different locations.
This component must be provided data obtained via the `useModelData` hook

**Kind**: static React Component of [<code>@nextstrain/evofr-viz</code>](#module_@nextstrain/evofr-viz)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>ModelDataWrapper</code> |  |
| graphType | <code>&#x27;growthAdvantage&#x27;</code> \| <code>&#x27;R&#x27;</code> \| <code>&#x27;frequency&#x27;</code> \| <code>&#x27;stackedIncidence&#x27;</code> |  |
| locations | <code>Array</code> \| <code>undefined</code> | Defaults to `undefined` which will display all available locations |

**Example**  
```js
<PanelDisplay graphType="ga"/>
```
<a name="module_@nextstrain/evofr-viz.exports.useModelData"></a>

### evofr.exports.useModelData ⇒ <code>ModelDataWrapper</code>
Fetch and parse the model data (JSON)

**Kind**: static constant of [<code>@nextstrain/evofr-viz</code>](#module_@nextstrain/evofr-viz)  

| Param | Type |
| --- | --- |
| config | <code>DatasetConfig</code> | 

<a name="module_@nextstrain/evofr-viz..TimePoint"></a>

### @nextstrain/evofr-viz~TimePoint : <code>Map</code>
An data point representing a model estimate at a certain date
Extra properties (e.g. "freq") are added in a data-dependent manner.

**Kind**: inner typedef of [<code>@nextstrain/evofr-viz</code>](#module_@nextstrain/evofr-viz)  
**Properties**

| Name | Type |
| --- | --- |
| date | <code>string</code> \| <code>undefined</code> | 

<a name="module_@nextstrain/evofr-viz..VariantPoint"></a>

### @nextstrain/evofr-viz~VariantPoint : <code>Map</code>
An data point representing a model estimate for a variant.
The properties defined directly here are not specific to any date.
Date-specific estimates are specified via `temporal`
Extra properties (e.g. "ga") are added in a data-dependent manner.

**Kind**: inner typedef of [<code>@nextstrain/evofr-viz</code>](#module_@nextstrain/evofr-viz)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| variant | <code>string</code> \| <code>undefined</code> | Variant name |
| temporal | <code>Array</code> \| <code>undefined</code> | Array of `TimePoint` estimates |

<a name="module_@nextstrain/evofr-viz..ModelData"></a>

### @nextstrain/evofr-viz~ModelData : <code>Map</code>
**Kind**: inner typedef of [<code>@nextstrain/evofr-viz</code>](#module_@nextstrain/evofr-viz)  
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

<a name="module_@nextstrain/evofr-viz..ModelDataWrapper"></a>

### @nextstrain/evofr-viz~ModelDataWrapper : <code>Object</code>
**Kind**: inner typedef of [<code>@nextstrain/evofr-viz</code>](#module_@nextstrain/evofr-viz)  
**Properties**

| Name | Type |
| --- | --- |
| modelData | <code>ModelData</code> \| <code>undefined</code> | 
| status | <code>string</code> | 
| error | <code>Error</code> \| <code>undefined</code> | 

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
| modelName | <code>string</code> | Name of the model - used to improve clarity of status & error messages |
| modelUrl | <code>string</code> | Address to fetch the model JSON from |
| sites | <code>Set</code> \| <code>undefined</code> | list of sites to extract from JSON. Undefined will use the sites set in the JSON metadata. |
| variantColors | <code>Map.&lt;string, string&gt;</code> | colors for the variants specified in the model JSONs |
| variantDisplayNames | <code>Map.&lt;string, string&gt;</code> | display names for the variants specified in the model JSONs |

