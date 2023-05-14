import React, {useState, useEffect, useCallback} from 'react';
import { PanelDisplay} from './lib/index.js';
import { parseModelData } from './lib/utils/parse.js'; // Note - not exposed by the library itself...

function App() {
  const [errorState, setErrorState] = useState(undefined)
  const [modelData, setModelData] = useState(undefined);

  const fetchProgress = useUrlDefinedDataset(setModelData, setErrorState);
  /* TODO - if we use this in production, there's a race condition if
  you try to fetch & drag-on a JSON at the ~same time */
  useListeners(setModelData, setErrorState);

  if (errorState) {
    /* Slightly different error handling than the expected usage */
    return (
      <div id="AppContainer">
        <h1>Error!</h1>
        <div className="abstract">{errorState}</div>
      </div>
    )
  }
  if (!modelData) {
    if (fetchProgress !== null) {
      return (
        <div id="AppContainer">
          <h1>Loading dataset via URL</h1>
          <div className="abstract">
            {fetchProgress}
          </div>
        </div>
      )
    }
    return (
      <div id="AppContainer">
        <h1>Drag & drop a model JSON to visualise</h1>
        <div className="abstract">
          This is intended as a simple way to preview JSONs,
          <p/>
          Alternatively, if your dataset is available via a URL, you can load it by adding the
          URL query parameter <code>?dataset=https://...</code> to the URL and reloading the page.
        </div>
      </div>
    )
  }
  return (
    <div id="AppContainer">
      <h1>{`Forecasting-viz preview for '${modelData.name}'`}</h1>
      {modelData?.modelData?.get('updated') &&
        <div className="abstract">
          {`Model updated ${modelData?.modelData?.get('updated')}`}
        </div>
      }
      <div id="mainPanelsContainer" >
        {modelData.sites.filter((site) => !site.endsWith("_forecast")).map((site) => {
          const preset = getPreset(site);
          if (!preset) {
            return (
              <h2 key={site}>{`Site ${site} doesn't (yet) have a graph preset`}</h2>
            )
          }
          return (
            <div key={site+preset}>
              <h2>{`Site ${site} / Graph preset ${preset}`}</h2>
              <PanelDisplay data={modelData} params={{preset}}/>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default App;

function getPreset(site) {
  if (site==="freq") return "frequency";
  if (site==="R") return "R_t";
  if (site==="I_smooth") return "stackedIncidence";
  if (site==="ga") return "growthAdvantage";
  return undefined;
}

function useListeners(setModelData, setErrorState) {
  const handleDragover = useCallback(
    (event) => {event.preventDefault();},
    []
  )
  const handleDrop = useCallback(
    async (event) => {
      setErrorState("");
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files.length!==1) {
        setErrorState(`Only one JSON can be used at a time, not ${files.length}.`);
        return 
      }
      try {
        const modelJson = await readFile(files[0])
        const fileName = files[0].name;
        const modelData = parseModelData(fileName, modelJson, undefined, undefined, undefined);
        modelData.sites = modelJson.metadata.sites;
        setModelData({modelData, sites: modelJson.metadata.sites, name: fileName, error: undefined});
      } catch (err) {
        setErrorState(`Error during file reading / parsing: ${err.message}`)
      }
    }, [setErrorState, setModelData]
  )
  useEffect(
    () => {
      document.addEventListener("dragover", handleDragover, false);
      document.addEventListener("drop", handleDrop, false);
      return () => {
        document.removeEventListener("dragover", handleDragover, false);
        document.removeEventListener("drop", handleDrop, false);
      }
    },
    [handleDragover, handleDrop]
  )
}

function useUrlDefinedDataset(setModelData, setErrorState) {
  const [fetchProgress, setFetchProgress] = useState(null)
  useEffect(
    () => {
      const datasetQuery =  (new URL(window.location))?.searchParams?.get('dataset');
      if (!datasetQuery) return; // no URL-defined dataset implies drag & drop usage
      let datasetUrl;
      try {
        datasetUrl = new URL(datasetQuery);
      } catch (err) {
        setErrorState(`Error while trying to parse the actual URL provided via the URL dataset query param: ${err.message}`)
        // setFetchProgress(null);
      }
      setFetchProgress(`Fetching ${datasetUrl}`)
      fetch(
        datasetUrl,
        {method: 'GET', mode: 'cors', credentials: 'omit', redirect: 'follow'}
      ).catch((err) => {
        setErrorState(`Error while trying to fetch the URL provided via the URL dataset query param: ${err.message}`)
        return Promise.reject(null);
      })
      .then((response) => {
        if (response.status===200) {
          setFetchProgress(`Fetched ${datasetUrl}. Parsing file...`);
          return response;
        }
        setErrorState(`Response status code ${response.status} while trying to fetch the URL provided via the URL dataset query param.`)
        return Promise.reject(null);
      })
      .then((response) => response.json())
      .then((modelJson) => {      
        const modelData = parseModelData(datasetUrl, modelJson, undefined, undefined, undefined);
        modelData.sites = modelJson.metadata.sites;
        setModelData({modelData, sites: modelJson.metadata.sites, name: datasetUrl, error: undefined});
      }).catch((err) => {
        setErrorState(`Successfully fetched the file at ${datasetUrl}, but there was an error when parsing the file contents: ${err.message}`)
      })
    }, [setModelData, setErrorState]
  )
  return fetchProgress;
}

// https://github.com/nextstrain/auspice.us/blob/fd5a7d4aff8101077d4ae9a4075139d71fc7af52/auspice_client_customisation/handleDroppedFiles.js
function readFile(file, isJSON=true) {
  return new Promise((resolve, reject) => {
    const fileReader = new window.FileReader();
    fileReader.onloadend = function(e) {
      if (isJSON) {
        const json = JSON.parse(e.target.result);
        resolve(json);
      } else {
        resolve(e.target.result);
      }
    };
    fileReader.onerror = function(e) {
      reject(e);
    };
    fileReader.readAsText(file);
  });
}

