import React from 'react';
import { Container, MainTitle, PanelAbstract } from './Styles.js';
import { Panels } from './Panels.js';
import { ModelDataProvider, ModelDataStatus } from './lib/index.js';
import './fonts.css';


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
    <Container>
      <ModelDataProvider config={datasetConfiguration}>
        <MainTitle>
          evofr visualisation library
        </MainTitle>

        <PanelAbstract>
          This page is used to test and develop the React Components which visualise evofr modelling datasets.
        </PanelAbstract>

        <ModelDataStatus/>

        <Panels/>

      </ModelDataProvider>
    </Container>
  );
}

export default App;
