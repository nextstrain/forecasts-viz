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

Currently this is unpublished and so to use it we pack the library into a tarball and then import from that within the parent app.


1. In this repo run `npm pack` to produce a tarball such as `nextstrain-evofr-viz-0.1.0.tgz`.
2. Move this to your App directory
3. Define the library as a dependency in your `package.json` via `"nextstrain-forecasts-viz": "file:./nextstrain-evofr-viz-0.1.0.tgz"`
4. Import components in your code as normal, e.g. `import { ModelDataProvider, ModelDataStatus } from 'nextstrain-evofr-viz';`


### How to run the test-app

```sh
conda create -n <env-name> -c conda-forge nodejs=18 # or similar
npm ci # install dependencies
npm run start # and view at http://localhost:3000
```

The model data JSONs are fetched from a Nextstrain S3 bucket.
If you wish to use local files for dev purposes you can do the following:

```sh
# provision the model JSONs
mkdir -p data/
curl --compressed "https://nextstrain-data.s3.amazonaws.com/files/workflows/forecasts-ncov/gisaid/nextstrain_clades/global/renewal/latest_results.json" --output data/renewal.json
curl --compressed "https://nextstrain-data.s3.amazonaws.com/files/workflows/forecasts-ncov/gisaid/nextstrain_clades/global/mlr/latest_results.json" --output data/mlr.json
# serve them over localhost:8000
node scripts/data-server.js
# in a separate terminal (or background the data server)
REACT_APP_RENEWAL_ENDPOINT="http://localhost:8000/renewal.json" \
  REACT_APP_MLR_ENDPOINT="http://localhost:8000/mlr.json" \
  npm run start
```

### Linting

`npm run lint`


