# Visualisation of evofr model outputs

> _This is a work in progress - all functionality, parameters etc are in flux_

React components to parse [evofr](https://github.com/blab/evofr) MLR model outputs and visualise them.
Based on prior work including:

* https://github.com/blab/rt-from-frequency-dynamics/tree/master/results/omicron-countries-split
* https://github.com/blab/rt-from-frequency-dynamics/tree/master/results/pango-countries

This repo includes the **source code for react components ("the library")** (`./src/lib`) and **a small testing app** to help develop them (`./test-app/`).
The test-app is [served via GitHub pages](https://nextstrain.github.io/forecasts-viz/) and you can drag-and-drop MLR model JSONs on to visualise them.

>  Currently the name of the library in `@nextstrain/evofr-viz` (as defined in `package.json`). Once we settle on a final name this GitHub repo will be renamed accordingly.

## How to use the library

Documentation is sparse at the moment! The best places to start would be:

* Read the API documentation in `docs/`
* Read the code in the test-app
* Read the code in [forecasts-flu](https://github.com/nextstrain/forecasts-flu/tree/main/viz) and/or [forecasts-ncov](https://github.com/nextstrain/forecasts-ncov/tree/main/viz) which use this library.

The library is not published to npm. Currently we:

1. In this repo run `npm pack` to produce a tarball such as `nextstrain-evofr-viz-0.*.*.tgz`.
2. Move this tarball to your App directory
3. `npm install nextstrain-evofr-viz-0.*.*.tgz`
4. Import components, e.g. `import { PanelDisplay, useModelData, ControlsProvider } from '@nextstrain/evofr-viz';`

## Development steps

Firstly create a suitable environment with nodejs (e.g. via conda):

```sh
conda create -n node24 -c conda-forge nodejs=24
conda activate node24
```


Install deps and run the test app, fetching canonical data JSONs from S3 before serving locally:

```sh
npm ci
npm run download
npm run dev:local
```

To preview a production build:

```sh
npm run build
npm run preview
```


### To deploy to GitHub pages

GitHub pages, at https://nextstrain.github.io/forecasts-viz/, runs the drag-and-drop page to facilitate previewing a model data JSON.
To update:

```sh
npm run deploy # will automatically push assets to the gh-pages branch
```

### How to develop the library in the context of a consuming app

If the consuming app supports it (e.g. `forecasts-flu/viz`), set
`LOCAL_LIB=1` when running its dev server. The consumer's Vite config
should alias `@nextstrain/evofr-viz` to this repo's `src/lib/` so edits
here hot-reload in the running app without any `npm pack` step.

For example, with `forecasts-viz` and `forecasts-flu` checked out as
siblings:

```sh
cd ../forecasts-flu/viz
LOCAL_LIB=1 npm run dev
```

