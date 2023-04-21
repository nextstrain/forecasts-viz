import React from 'react';
import { PanelDisplay, useModelData} from './lib/index.js';
import './styles.css';

let locations = undefined;
// uncomment the following line to limit the number of small multiples
// locations = ["Australia", "Canada"];
// locations = ["Australia", "Canada", "Denmark", "France"];

const DEFAULT_ENDPOINT_PREFIX = "https://nextstrain-data.s3.amazonaws.com/files/workflows/forecasts-ncov/gisaid/nextstrain_clades/global";
const baseConfiguration = {
  sites: undefined,
  variantColors: new Map([
    ["other", "#737373"],
    ["21L (Omicron)", "#BDBDBD"],
    ["22A (Omicron)", "#447CCD"],
    ["22B (Omicron)", "#5EA9A1"],
    ["22C (Omicron)", "#8ABB6A"],
    ["22D (Omicron)", "#BEBB48"],
    ["22E (Omicron)", "#E29E39"],
    ["22F (Omicron)", "#E2562B"],
    ["23A (Omicron)", "#FF322C"],
  ]),
  variantDisplayNames: new Map([
    ["other", "other"],
    ["21L (Omicron)", "21L (BA.2)"],
    ["22A (Omicron)", "22A (BA.4)"],
    ["22B (Omicron)", "22B (BA.5)"],
    ["22C (Omicron)", "22C (BA.2.12.1)"],
    ["22D (Omicron)", "22D (BA.2.75)"],
    ["22E (Omicron)", "22E (BQ.1) some really long name"],
    ["22F (Omicron)", "22F (XBB)"],
    ["23A (Omicron)", "23A (XBB.1.5)"],
  ])
}
const mlrConfig = {
  modelName: "MLR",
  modelUrl: process.env.REACT_APP_MLR_ENDPOINT || `${DEFAULT_ENDPOINT_PREFIX}/mlr/latest_results.json`,
  ...baseConfiguration
};
const renewalConfig = {
  modelName: "Renewal",
  modelUrl: process.env.REACT_APP_RENEWAL_ENDPOINT || `${DEFAULT_ENDPOINT_PREFIX}/renewal/latest_results.json`,
  ...baseConfiguration
};

function App() {
  const mlrData = useModelData(mlrConfig);
  const renewalData = useModelData(renewalConfig);

  return (
    <div id="AppContainer">
      <h1>
        evofr visualisation library
      </h1>

      <div className="abstract">
        This page is used to test and develop the React Components which visualise evofr modelling datasets.
      </div>

      <div id="mainPanelsContainer" >

        <h2>{`MLR Variant Frequencies`}</h2>
        <div className="abstract">{`Data comes from objects matching {'freq', 'freq_forecast'} + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}</div>
        {/*You can inject styles via a prop like `facetStyles={{top: 40}}`*/}
        <PanelDisplay data={mlrData} locations={locations} graphType="frequency"/>

        <h2>{`Renewal Variant Frequencies`}</h2>
        <div className="abstract">{`Data comes from objects matching {'freq', 'freq_forecast'} + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}</div>
        <PanelDisplay data={renewalData} locations={locations} graphType="frequency"/>

        <h2>{`MLR Growth Advantage`}</h2>
        <div className="abstract">{`Data comes from objects matching 'ga' + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}</div>
        <PanelDisplay data={mlrData} locations={locations} graphType="growthAdvantage"/>

        <h2>{`Renewal Growth Advantage`}</h2>
        <div className="abstract">{`Data comes from objects matching 'ga' + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}</div>
        <PanelDisplay data={renewalData} locations={locations} graphType="growthAdvantage"/>

        <h2>{`Estimated Cases over time (Renewal Model)`}</h2>
        <div className="abstract">{`Data comes from objects matching 'I_smooth' + 'median'`}</div>
        <PanelDisplay data={renewalData} locations={locations} graphType="stackedIncidence"/>


        <h2>{`Estimated effective reproduction number over time (Renewal Model)`}</h2>
        <div className="abstract">
          {`Data comes from renewal model objects matching 'R' + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}
        </div>
        <PanelDisplay data={renewalData} locations={locations} graphType="R"/>

      </div>

    </div>
  );
}

export default App;
