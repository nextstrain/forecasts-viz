# Visualisation of evofr model outputs

> _This is a work in progress - all functionality, parameters etc are in flux_

React components to parse [evofr](https://github.com/blab/evofr) model outputs and visualise them.
Based on prior work including:

* https://github.com/blab/rt-from-frequency-dynamics/tree/master/results/omicron-countries-split
* https://github.com/blab/rt-from-frequency-dynamics/tree/master/results/pango-countries

This repo includes the source code for the library (`./src/lib`) and a small test-app to showcase
them and for development purposes (`./src/index.jsx`).

Currently the name of the library in `@nextstrain/evofr-viz` (as defined in `package.json`).
Once we settle on a final name this GitHub repo will be renamed accordingly.

### Examples of how to use the Components

Please see the [`api.md`](./api.md) file for documentation and the code in [`./src/sarsCov2-testApp.jsx`](./src/sarsCov2-testApp.jsx) for a working example

### How to import the library

If you wish to use this library in another project (i.e. outside this repo), you can use the following steps.
This approach is how we use the library in [forecasts-ncov](https://github.com/nextstrain/forecasts-ncov/tree/main/viz).
Note that this is temporary: once we publish this on npm it'll be a typical `npm install` command.

1. In this repo run `npm pack` to produce a tarball such as `nextstrain-evofr-viz-0.1.0.tgz`.
2. Move this tarball to your App directory
3. `npm install nextstrain-evofr-viz-0.1.0.tgz` (filename may be slightly different).
4. Import components in your code as normal, e.g. `import { ModelDataProvider, ModelDataStatus } from 'nextstrain-evofr-viz';`


### How to run the test-app contained in this repo

We use a basic test-app in this repo to help with development of the library.
The test app has two pages:
* `/` - visualises SARS-CoV-2 data (see [forecasts-ncov](github.com/nextstrain/forecasts-ncov/) for details).
* `/dragdrop` - allows a model JSON to be dropped onto the window to visualise

Firstly create a suitable environment with nodejs (e.g. via conda):

```sh
conda create -n node20 -c conda-forge nodejs=20
conda activate node20
```

Install deps and run the test app, fetching canonical data JSONs from S3:

```sh
npm ci
npm run dev
```

Or (recommended) pre-fetch the JSON files (to `./data`) and serve them locally:

```sh
npm run download
npm run dev:local
```

To preview a production build:

```sh
npm run build
npm run preview
```

### Building the library

```sh
npm run build:lib   # writes dist/index.js + dist/index.css
npm pack            # produces nextstrain-evofr-viz-<version>.tgz (runs build:lib via prepack)
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

