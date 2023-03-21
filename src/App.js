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
          Nextstrain SARS-CoV-2 Forecasts
        </MainTitle>

        <PanelAbstract>
          <>This page visualises the evolution and dynamics of SARS-CoV-2 evolution and dynamics using two models:</>
          <ul>
            <li>Multinomial Logistic Regression (MLR) estimates variant frequencies and growth advantages for variants against some baseline using sequence count data</li>
            <li>The variant renewal model estimates variant frequencies, variant-specific incidence, and growth advantages using a combination of case and sequence count data.</li>
          </ul>
          <>Each model uses sequence counts via GISAID and case counts from various sources, collated in our <a href="https://github.com/nextstrain/forecasts-ncov/tree/main/ingest">forecasts-ncov GitHub repo</a>.</>
          <>{` For more information on the models please see the `}<a href="https://www.github.com/blab/evofr">evofr GitHub repo</a> or the preprint <a href="https://bedford.io/papers/figgins-rt-from-frequency-dynamics/">"SARS-CoV-2 variant dynamics across US states show consistent differences in effective reproduction numbers"</a>.</>
          <br/><br/>
          <>Currently we use <a href='https://nextstrain.org/blog/2022-04-29-SARS-CoV-2-clade-naming-2022'>Nextstrain clades</a> to partition the sequences into variants.</>
        </PanelAbstract>

        <ModelDataStatus/>

        <Panels/>

      </ModelDataProvider>
    </Container>
  );
}

export default App;
