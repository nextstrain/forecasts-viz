# Visualisation of evofr model outputs

> _This is a work in progress - all functionality, parameters etc are in flux_

React components to parse [evofr](https://github.com/blab/evofr) model outputs and visualise them.
Based on prior work including:

* https://github.com/blab/rt-from-frequency-dynamics/tree/master/results/omicron-countries-split
* https://github.com/blab/rt-from-frequency-dynamics/tree/master/results/pango-countries

This repo includes the source code for the library (`./src/lib`) and a small test-app to showcase
them and for development purposes (`./src/App.js`).

Currently the name of the library in `@nextstrain/evofr-viz` (as defined in `package.json`).
Once we settle on a final name this GitHub repo will be renamed accordingly.

### Examples of how to use the Components

Please see the [`api.md`](./api.md) file for documentation and the code in [`./src/App.js`](./src/App.js) for a working example

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
* http://localhost:3000 - visualises SARS-CoV-2 data (see [forecasts-ncov](github.com/nextstrain/forecasts-ncov/) for details).
* http://localhost:3000/dragdrop - allows a model JSON to be dropped onto the window to visualise


Firstly create a suitable environment with nodejs, e.g. by using conda:

```sh
conda create -n node18 -c conda-forge nodejs=18 # or similar
conda activate node18
```
Then install dependencies and run the test app:

```sh
npm ci # install dependencies
npm run start
```

In the above configuration, http://localhost:3000 will fetch SARS-CoV-2 model JSONs from our S3 bucket.
It can be a nicer experience to first download these files (or others!) to `./data` and use those instead:

```sh
# provision the model JSONs
mkdir -p data/
curl --compressed "https://nextstrain-data.s3.amazonaws.com/files/workflows/forecasts-ncov/gisaid/nextstrain_clades/global/renewal/latest_results.json" --output data/renewal.json
curl --compressed "https://nextstrain-data.s3.amazonaws.com/files/workflows/forecasts-ncov/gisaid/nextstrain_clades/global/mlr/latest_results.json" --output data/mlr.json
# serve them over localhost:8000 in a background process
node scripts/data-server.js &
REACT_APP_RENEWAL_ENDPOINT="http://localhost:8000/renewal.json" \
  REACT_APP_MLR_ENDPOINT="http://localhost:8000/mlr.json" \
  npm run start
```

To run the test app in a production mode:

```sh
npm run build:local
npm run serve
```

### Linting

`npm run lint`

### To deploy to GitHub pages

GitHub pages, at https://nextstrain.github.io/forecasts-viz/, runs the drag-and-drop page to facilitate previewing a model data JSON.
To update:

```sh
npm run deploy # will automatically push assets to the gh-pages branch
```


