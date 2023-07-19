import React, {useState} from 'react';
import { PanelDisplay, useModelData} from './lib/index.js';
import './styles.css';
/* Following are not currently exported by the library itself */
import { getDomainUsingKey } from "./lib/components/Graph.js";
import { displayTopVariants } from "./lib/utils/tooltipDisplay.js";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

let locations = undefined;
/* It's helpful for dev purposes to not see _all_ the small multiples. Uncomment the
following line to remove this filtering */
// locations = ["Australia", "Canada", "Denmark", "France", "China", "USA"];

const DEFAULT_ENDPOINT_PREFIX = "https://nextstrain-data.s3.amazonaws.com/files/workflows/forecasts-ncov";
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

const config = {
  'cladesMlr': {
    modelName: "clades/MLR",
    modelUrl: process.env.REACT_APP_CLADES_MLR || `${DEFAULT_ENDPOINT_PREFIX}/gisaid/nextstrain_clades/global/mlr/latest_results.json`,
    ...baseConfiguration
  },
  'cladesRenewal': {
    modelName: "clades/renewal",
    modelUrl: process.env.REACT_APP_CLADES_RENEWAL || `${DEFAULT_ENDPOINT_PREFIX}/gisaid/nextstrain_clades/global/renewal/latest_results.json`,
    ...baseConfiguration
  },
  'lineagesMlr': {
    modelName: "lineages/MLR",
    modelUrl: process.env.REACT_APP_LINEAGES_MLR || `${DEFAULT_ENDPOINT_PREFIX}/gisaid/pango_lineages/global/mlr/latest_results.json`,
    ...baseConfiguration
  },
}

/** Create certain functions for the custom incidence line graph so that
 * they are not recreated each time <App> re-renders, as their recreation
 * will cause the params to be different (at a deep-equality level) and thus
 * will result in all the graphs re-drawing.
 * We could achieve the same result inside App() via useMemo.
 */
const incidenceLinesTooltip = displayTopVariants();
const incidenceDomain = getDomainUsingKey('I_smooth_HDI_95_upper');

function App() {
  const cladesMlrData = useModelData(config.cladesMlr);
  const cladesRenewalData = useModelData(config.cladesRenewal);
  const lineagesMlrData = useModelData(config.lineagesMlr);

  const [count, setCount] = useState(1);

  return (
    <div id="AppContainer">
      <h1>
        evofr visualisation library
      </h1>

      <div className="abstract">
        This page is used to test and develop the React Components which visualise evofr modelling datasets.
      </div>

      <button onClick={() => {
        console.log("*** Triggering <App> to re-render ***");
        setCount(count+1);
      }}>
        {`Trigger <App> re-render. n=${count}`}
      </button>

      <div style={{paddingBottom: '20px'}}/>

      <div id="mainPanelsContainer" >

        <Tabs>
          <TabList>
            <Tab>Clades / MLR</Tab>
            <Tab>Lineages / MLR</Tab>
            <Tab>Clades / Renewal</Tab>
          </TabList>

          {/* ----------------------------- CLADES / MLR ----------------------------- */}
          <TabPanel>
            <h2>{`General line graph (preset: 'frequency')`}</h2>
            <div className="abstract">{`Data comes from Clades/MLR model (updated: ${cladesMlrData?.modelData?.get('updated')}), objects matching {'freq', 'freq_forecast'} + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}</div>
            {/*You can inject styles via a prop like `styles={{top: 40}}`*/}
            <PanelDisplay data={cladesMlrData} locations={locations} params={{preset: "frequency"}}/>

            <h2>{`Growth Advantage (preset: 'growthAdvantage')`}</h2>
            <div className="abstract">{`Data comes from MLR model, objects matching 'ga' + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}</div>
            <PanelDisplay data={cladesMlrData} locations={locations} params={{preset: "growthAdvantage"}}/>
          </TabPanel>

          {/* ----------------------------- LINEAGES / MLR ----------------------------- */}
          <TabPanel>
            <h2>{`General line graph (preset: 'frequency')`}</h2>
            <div className="abstract">{`Data comes from Lineages/MLR model (updated: ${cladesMlrData?.modelData?.get('updated')}), objects matching {'freq', 'freq_forecast'} + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}</div>
            {/*You can inject styles via a prop like `styles={{top: 40}}`*/}
            <PanelDisplay data={lineagesMlrData} locations={locations} params={{preset: "frequency"}}/>

            <h2>{`Growth Advantage (preset: 'growthAdvantage')`}</h2>
            <div className="abstract">{`Data comes from Lineages/MLR model, objects matching 'ga' + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}</div>
            <PanelDisplay data={lineagesMlrData} locations={locations} params={{preset: "growthAdvantage"}}/>
          </TabPanel>

          {/* ----------------------------- RENEWAL / MLR ----------------------------- */}
          <TabPanel>
            <h2>{`Stream graph (preset: 'stackedIncidence')`}</h2>
            <div className="abstract">
              {`Custom styling to be 400px wide (default: 250px).
              Data comes from Renewal model objects matching 'I_smooth' + 'median'`}
            </div>
            <PanelDisplay data={cladesRenewalData} locations={locations}
              styles={{width: 400}}
              params={{preset: "stackedIncidence"}}
            /> 

            <h2>{`Line graph using I_smooth`}</h2>
            <div className="abstract">
              {`An example of using the 'params' React prop in the calling app to completely define how the
              graph looks -- we specify the graphType (lines), the data key (I_smooth),
              the HPD interval keys, the yDomain and the tooltip function`}
            </div>
            <PanelDisplay data={cladesRenewalData} locations={locations} params={{
              graphType: "lines",
              key: 'I_smooth',
              interval:  ['I_smooth_HDI_95_lower', 'I_smooth_HDI_95_upper'],
              intervalOpacity: 0.3,
              yDomain: incidenceDomain,
              tooltipXY: incidenceLinesTooltip,
            }}/>

            <h2>{`Estimated effective reproduction number over time (Renewal Model)`}</h2>
            <div className="abstract">
              {`Data comes from renewal model (updated: ${cladesRenewalData?.modelData?.get('updated')}) matching 'R' + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}
            </div>
            <PanelDisplay data={cladesRenewalData} locations={locations} params={{preset: "R_t"}}/>
          </TabPanel>
        </Tabs>

      </div>

    </div>
  );
}

export default App;
