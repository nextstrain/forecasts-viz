import React, { useState } from 'react';
import { PanelDisplay, useModelData } from '../src/lib/index.js';
import type { DatasetConfig } from '../src/lib/index.js';
import { ControlsProvider } from '../src/lib/hooks/ControlsContext.tsx';
import './styles.css';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

type Locations = string[] | undefined;

let locations: Locations = undefined;
/* It's helpful for dev purposes to not see _all_ the small multiples. Uncomment the
following line to remove this filtering */
// locations = ["Australia", "Canada", "Denmark", "France", "China", "USA"];

function App() {
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
        console.log('*** Triggering <App> to re-render ***');
        setCount(count + 1);
      }}
      >
        {`Trigger <App> re-render. n=${count}`}
      </button>

      <div style={{ paddingBottom: '20px' }} />
      <div id="mainPanelsContainer" >
        <Tabs>
          <TabList>
            <Tab>Clades / MLR</Tab>
            <Tab>Lineages / MLR</Tab>
          </TabList>
          <TabPanel>
            <CladesMLR />
          </TabPanel>
          <TabPanel>
            <LineagesMLR />
          </TabPanel>
        </Tabs>

      </div>

    </div>
  );
}

export default App;

const DEFAULT_ENDPOINT_PREFIX = 'https://nextstrain-data.s3.amazonaws.com/files/workflows/forecasts-ncov';

const config: Record<string, DatasetConfig> = {
  cladesMlr: {
    modelName: 'clades/MLR',
    modelUrl: import.meta.env.VITE_CLADES_MLR || `${DEFAULT_ENDPOINT_PREFIX}/gisaid/nextstrain_clades/global/mlr/latest_results.json`,
    sites: undefined,
  },
  lineagesMlr: {
    modelName: 'lineages/MLR',
    modelUrl: import.meta.env.VITE_LINEAGES_MLR || `${DEFAULT_ENDPOINT_PREFIX}/gisaid/pango_lineages/global/mlr/latest_results.json`,
    // don't add baseConfiguration as the JSON defines the colours and we don't want the config to override this
    sites: undefined,
  },
};

function CladesMLR() {
  const cladesMlrData = useModelData(config.cladesMlr);
  return (
    <ControlsProvider>
      <h2>{`General line graph (preset: 'frequency')`}</h2>
      <div className="abstract">{`Data comes from Clades/MLR model (updated: ${cladesMlrData?.modelData?.get('updated')}), objects matching {'freq', 'freq_forecast'} + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}</div>
      {/*You can inject styles via a prop like `styles={{top: 40}}`*/}
      <PanelDisplay data={cladesMlrData} locations={locations} params={{ preset: 'frequency' }} />

      
      <h2>{`Relative growth advantage vs frequency`}</h2>
      <PanelDisplay data={cladesMlrData} params={{ preset: 'relativeGA' }} />
      
      <h2>{`Population-relative Growth Advantage`}</h2>
      <PanelDisplay data={cladesMlrData} params={{ preset: 'freqGA' }} />
      
      <h2>{`Growth Advantage (preset: 'growthAdvantage')`}</h2>
      <div className="abstract">{`Data comes from MLR model, objects matching 'ga' + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}</div>
      <PanelDisplay data={cladesMlrData} locations={locations} params={{ preset: 'growthAdvantage' }} />
      
      
    </ControlsProvider>
  );
}

function LineagesMLR() {
  const lineagesMlrData = useModelData(config.lineagesMlr);
  return (
    <ControlsProvider>
      <h2>{`General line graph (preset: 'frequency')`}</h2>
      <div className="abstract">{`Data comes from Lineages/MLR model (updated: ${lineagesMlrData?.modelData?.get('updated')}), objects matching {'freq', 'freq_forecast'} + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}</div>
      {/*You can inject styles via a prop like `styles={{top: 40}}`*/}
      <PanelDisplay data={lineagesMlrData} locations={locations} params={{ preset: 'frequency' }} />

      <h2>{`Growth Advantage (preset: 'growthAdvantage')`}</h2>
      <div className="abstract">{`Data comes from Lineages/MLR model, objects matching 'ga' + {'median', 'HDI_95_lower', 'HDI_95_upper'}`}</div>
      <PanelDisplay data={lineagesMlrData} locations={locations} params={{ preset: 'growthAdvantage' }} />
    </ControlsProvider>
  );
}
