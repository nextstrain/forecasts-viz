import React from 'react';
import { ModelDataProvider, ModelDataStatus, PanelDisplay} from './lib/index.js';
import './styles.css';

let locations = undefined;
// uncomment the following line to limit the number of small multiples
// locations = ["Australia", "Belgium"];

const DEFAULT_ENDPOINT_PREFIX = "https://nextstrain-data.s3.amazonaws.com/files/workflows/forecasts-ncov/gisaid/nextstrain_clades/global";
const DEFAULT_RENEWAL_ENDPOINT = `${DEFAULT_ENDPOINT_PREFIX}/renewal/latest_results.json`;
const DEFAULT_MLR_ENDPOINT = `${DEFAULT_ENDPOINT_PREFIX}/mlr/latest_results.json`;
const datasetConfiguration = {
  mlrUrl: process.env.REACT_APP_MLR_ENDPOINT || DEFAULT_MLR_ENDPOINT,
  renewalUrl: process.env.REACT_APP_RENEWAL_ENDPOINT || DEFAULT_RENEWAL_ENDPOINT,
  variantColors: new Map([
    ["other", "#737373"],
    ["21L (Omicron)", "#BDBDBD"],
    ["22A (Omicron)", "#447CCD"],
    ["22B (Omicron)", "#5EA9A1"],
    ["22C (Omicron)", "#8ABB6A"],
    ["22D (Omicron)", "#BEBB48"],
    ["22E (Omicron)", "#E29E39"],
    ["22F (Omicron)", "#E2562B"]
  ]),
  variantDisplayNames: new Map([
    ["other", "other"],
    ["21L (Omicron)", "BA.2"],
    ["22A (Omicron)", "BA.4"],
    ["22B (Omicron)", "BA.5"],
    ["22C (Omicron)", "BA.2.12.1"],
    ["22D (Omicron)", "BA.2.75"],
    ["22E (Omicron)", "BQ.1"],
    ["22F (Omicron)", "XBB"],
  ])
}

function App() {
  return (
    <div id="AppContainer">
      <ModelDataProvider config={datasetConfiguration}>
        <h1>
          evofr visualisation library
        </h1>

        <div className="abstract">
          This page is used to test and develop the React Components which visualise evofr modelling datasets.
        </div>

        <ModelDataStatus/>

        <div id="mainPanelsContainer" >

          <h2>
            {`Variant Frequencies`}
          </h2>
          <div className="abstract">
            {`Data comes from MLR model objects matching {'freq', 'freq_forecast'} + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}
          </div>

          <PanelDisplay locations={locations} graphType="frequency"/>

          <h2>
            {`Growth Advantage`}
          </h2>
          <div className="abstract">
            {`Data comes from MLR model objects matching 'ga' + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}
          </div>
          <PanelDisplay locations={locations} graphType="growthAdvantage"/>

          <h2>
            {`Estimated Cases over time`}
          </h2>
          <div className="abstract">
            {`Data comes from Renewal model objects matching 'I_smooth' + 'median'`}
          </div>
          <PanelDisplay locations={locations} graphType="stackedIncidence"/>


          <h2>
            {`Estimated effective reproduction number over time`}
          </h2>
          <div className="abstract">
            {`Data comes from renewal model objects matching 'R' + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}
          </div>
          <PanelDisplay locations={locations} graphType="r_t"/>

        </div>

      </ModelDataProvider>
    </div>
  );
}

export default App;
