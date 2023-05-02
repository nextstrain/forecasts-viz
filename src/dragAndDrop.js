import React, {useState, useEffect, useCallback} from 'react';
import { PanelDisplay} from './lib/index.js';
import { parseModelData } from './lib/utils/parse.js'; // Note - not exposed by the library itself...

function App() {
  const [errorState, setErrorState] = useState(undefined)
  const [modelData, setModelData] = useState(undefined);
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
    return (
      <div id="AppContainer">
        <h1>Drag & drop a model JSON to visualise</h1>
        <div className="abstract">
          This is intended as a simple way to preview JSONs
        </div>
      </div>
    )
  }
  return (
    <div id="AppContainer">
      <h1>{`Forecasting-viz preview for '${modelData.name}'`}</h1>
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
              <PanelDisplay data={modelData} params={{preset}} styles={graphSize(modelData)}/>
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


/** Graph size should be dynamically calculated - and responsive based on screen size,
 * num variants, num locations etc etc.
 * This function basically acts as switch for clade-based analysis vs pango-based analysis.
 * We should build in a (properly) responsive best-guess in the library itself.
 * Note that this is _not_ responsive to screen size changes!
 */
function graphSize(modelData) {
  const WINDOW_WIDTH_FOR_SIDEBAR_LEGEND = 1200;
  const width = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;
  if (modelData && modelData.modelData.get("variants").length>50) {
    if (width > WINDOW_WIDTH_FOR_SIDEBAR_LEGEND ) {
      return {
        width: width-300 > 800 ? 800 : (width-300), // ad-hoc
        height: 250,
        right: 50, // more space for labels etc
        bottom: 80,
        left: 50,
      }
    }
    return {
      width: width-50, // 400 to include legend + some padding, without it appearing too big
      height: 250,
    }
  }
  return {};
}
