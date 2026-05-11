[**@nextstrain/evofr-viz**](../README.md)

***

[@nextstrain/evofr-viz](../README.md) / GraphParams

# Interface: GraphParams

Defined in: [utils/graphParams.ts:10](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L10)

## Indexable

> \[`key`: `string`\]: `any`

## Properties

### annotateFinalPoint?

> `optional` **annotateFinalPoint?**: `boolean`

Defined in: [utils/graphParams.ts:32](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L32)

***

### canUseLogit

> **canUseLogit**: `boolean`

Defined in: [utils/graphParams.ts:15](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L15)

***

### dashedLines?

> `optional` **dashedLines?**: `number`[]

Defined in: [utils/graphParams.ts:30](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L30)

***

### forecastLine?

> `optional` **forecastLine?**: `boolean`

Defined in: [utils/graphParams.ts:31](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L31)

***

### graphType

> **graphType**: `"points"` \| `"lines"` \| `"statespace"`

Defined in: [utils/graphParams.ts:12](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L12)

***

### interval

> **interval**: \[`string`, `string`\]

Defined in: [utils/graphParams.ts:14](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L14)

***

### intervalOpacity?

> `optional` **intervalOpacity?**: `number`

Defined in: [utils/graphParams.ts:18](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L18)

***

### intervalStrokeWidth?

> `optional` **intervalStrokeWidth?**: `number`

Defined in: [utils/graphParams.ts:19](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L19)

***

### key

> **key**: `string`

Defined in: [utils/graphParams.ts:13](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L13)

***

### preset

> **preset**: `string`

Defined in: [utils/graphParams.ts:11](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L11)

***

### showRawPoints

> **showRawPoints**: `boolean`

Defined in: [utils/graphParams.ts:16](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L16)

***

### showSmoothedPoints

> **showSmoothedPoints**: `boolean`

Defined in: [utils/graphParams.ts:17](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L17)

***

### tooltipPt?

> `optional` **tooltipPt?**: `any`

Defined in: [utils/graphParams.ts:22](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L22)

***

### tooltipXY?

> `optional` **tooltipXY?**: `any`

Defined in: [utils/graphParams.ts:21](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L21)

Why are their two tooltip properties?!?!

***

### xDomain?

> `optional` **xDomain?**: () => `any`

Defined in: [utils/graphParams.ts:28](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L28)

#### Returns

`any`

***

### yDomain

> **yDomain**: \[`number`, `number`\] \| ((`this`) => \[`number`, `number`\])

Defined in: [utils/graphParams.ts:27](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L27)

The domains should be in the `parse` code - they're more related to the _data_ than
how we should visualize it. Unless viz wants to focus in on things? TODO XXX

***

### yTickFmt?

> `optional` **yTickFmt?**: (`n`) => `string`

Defined in: [utils/graphParams.ts:29](https://github.com/nextstrain/forecasts-viz/blob/442f962da6103585ab645c58a14805e2598eff82/src/lib/utils/graphParams.ts#L29)

#### Parameters

##### n

`number` \| \{ `valueOf`: `number`; \}

#### Returns

`string`
