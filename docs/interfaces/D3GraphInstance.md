[**@nextstrain/evofr-viz**](../README.md)

***

[@nextstrain/evofr-viz](../README.md) / D3GraphInstance

# Interface: D3GraphInstance

Defined in: [utils/d3Graph.ts:11](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L11)

## Properties

### area

> **area**: `any`

Defined in: [utils/d3Graph.ts:22](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L22)

***

### controls

> **controls**: [`Controls`](Controls.md)

Defined in: [utils/d3Graph.ts:16](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L16)

***

### emptyData

> **emptyData**: `boolean`

Defined in: [utils/d3Graph.ts:18](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L18)

***

### line

> **line**: `any`

Defined in: [utils/d3Graph.ts:21](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L21)

***

### modelData

> **modelData**: [`ModelData`](ModelData.md)

Defined in: [utils/d3Graph.ts:14](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L14)

***

### params

> **params**: [`GraphParamsWithLocation`](../type-aliases/GraphParamsWithLocation.md)

Defined in: [utils/d3Graph.ts:15](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L15)

***

### points

> **points**: `any`[]

Defined in: [utils/d3Graph.ts:24](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L24)

***

### sizes

> **sizes**: `any`

Defined in: [utils/d3Graph.ts:17](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L17)

***

### styles

> **styles**: `any`

Defined in: [utils/d3Graph.ts:23](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L23)

***

### svg

> **svg**: `Selection`\<`SVGSVGElement`, `unknown`, `null`, `undefined`\>

Defined in: [utils/d3Graph.ts:12](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L12)

***

### tooltip

> **tooltip**: `any`

Defined in: [utils/d3Graph.ts:13](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L13)

***

### x

> **x**: `any`

Defined in: [utils/d3Graph.ts:19](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L19)

***

### y

> **y**: `any`

Defined in: [utils/d3Graph.ts:20](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L20)

## Methods

### annotateFinalPoint()

> **annotateFinalPoint**(): `void`

Defined in: [utils/d3Graph.ts:34](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L34)

#### Returns

`void`

***

### createScales()

> **createScales**(): `void`

Defined in: [utils/d3Graph.ts:26](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L26)

#### Returns

`void`

***

### drawDashedLines()

> **drawDashedLines**(): `void`

Defined in: [utils/d3Graph.ts:39](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L39)

#### Returns

`void`

***

### drawForecastLine()

> **drawForecastLine**(): `void`

Defined in: [utils/d3Graph.ts:38](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L38)

#### Returns

`void`

***

### drawLines()

> **drawLines**(): `void`

Defined in: [utils/d3Graph.ts:32](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L32)

#### Returns

`void`

***

### drawPoints()

> **drawPoints**(): `void`

Defined in: [utils/d3Graph.ts:33](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L33)

#### Returns

`void`

***

### drawXAxis()

> **drawXAxis**(): `void`

Defined in: [utils/d3Graph.ts:27](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L27)

#### Returns

`void`

***

### drawYAxis()

> **drawYAxis**(): `void`

Defined in: [utils/d3Graph.ts:28](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L28)

#### Returns

`void`

***

### getVariantColor()

> **getVariantColor**(`variant`): `string`

Defined in: [utils/d3Graph.ts:41](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L41)

#### Parameters

##### variant

`string`

#### Returns

`string`

***

### setStyles()

> **setStyles**(): `void`

Defined in: [utils/d3Graph.ts:25](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L25)

#### Returns

`void`

***

### setupArea()

> **setupArea**(): `void`

Defined in: [utils/d3Graph.ts:31](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L31)

#### Returns

`void`

***

### setupLine()

> **setupLine**(): `void`

Defined in: [utils/d3Graph.ts:30](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L30)

#### Returns

`void`

***

### setupTooltipXY()

> **setupTooltipXY**(): `void`

Defined in: [utils/d3Graph.ts:29](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L29)

#### Returns

`void`

***

### setVariantFocus()

> **setVariantFocus**(): `void`

Defined in: [utils/d3Graph.ts:37](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L37)

#### Returns

`void`

***

### title()

> **title**(): `void`

Defined in: [utils/d3Graph.ts:40](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L40)

#### Returns

`void`

***

### togglePoints()

> **togglePoints**(`key`): `void`

Defined in: [utils/d3Graph.ts:36](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L36)

#### Parameters

##### key

`"raw"` \| `"smoothed"`

#### Returns

`void`

***

### updateScale()

> **updateScale**(): `void`

Defined in: [utils/d3Graph.ts:35](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/d3Graph.ts#L35)

#### Returns

`void`
