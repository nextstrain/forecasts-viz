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
  const handleFileSelect = useFileSelect(setModelData, setErrorState);

  if (errorState) {
    /* Slightly different error handling than the expected usage */
    return (
      <div id="AppContainer">
        <h1>Error!</h1>
        <div className="abstract">
          <pre style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '5px',
            fontSize: '14px',
            lineHeight: '1.5',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            {errorState}
          </pre>
        </div>
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
          Or <button onClick={handleFileSelect} style={{padding: '10px 20px', cursor: 'pointer'}}>Choose a file from Finder</button>
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

        // Validate JSON structure before parsing
        const validationError = validateModelJson(modelJson);
        if (validationError) {
          setErrorState(validationError);
          return;
        }

        let modelData;
        try {
          modelData = parseModelData(fileName, modelJson, undefined, undefined, undefined);
        } catch (parseError) {
          // Parsing failed - provide helpful context
          console.error('Parse error:', parseError);
          const contextInfo = getJsonContext(modelJson);
          setErrorState(formatError(parseError, contextInfo, fileName));
          return;
        }

        modelData.sites = modelJson.metadata.sites;
        setModelData({modelData, sites: modelJson.metadata.sites, name: fileName, error: undefined});
      } catch (err) {
        setErrorState(formatSimpleError(err, 'Error during file reading / parsing'))
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
        // Validate JSON structure before parsing
        const validationError = validateModelJson(modelJson);
        if (validationError) {
          setErrorState(`Successfully fetched the file at ${datasetUrl}, but the JSON structure is invalid:\n\n${validationError}`);
          return;
        }

        let modelData;
        try {
          modelData = parseModelData(datasetUrl, modelJson, undefined, undefined, undefined);
        } catch (parseError) {
          // Parsing failed - provide helpful context
          const contextInfo = getJsonContext(modelJson);
          setErrorState(formatError(parseError, contextInfo, datasetUrl));
          return;
        }

        modelData.sites = modelJson.metadata.sites;
        setModelData({modelData, sites: modelJson.metadata.sites, name: datasetUrl, error: undefined});
      }).catch((err) => {
        if (err) {
          setErrorState(formatSimpleError(err, `Successfully fetched the file at ${datasetUrl}, but there was an error when parsing the file contents`))
        }
      })
    }, [setModelData, setErrorState]
  )
  return fetchProgress;
}

function useFileSelect(setModelData, setErrorState) {
  const fileInputRef = React.useRef(null);

  const handleFileChange = useCallback(
    async (event) => {
      setErrorState("");
      const files = event.target.files;
      if (files.length !== 1) {
        setErrorState(`Only one JSON can be used at a time, not ${files.length}.`);
        return;
      }
      try {
        const modelJson = await readFile(files[0]);
        const fileName = files[0].name;

        // Validate JSON structure before parsing
        const validationError = validateModelJson(modelJson);
        if (validationError) {
          setErrorState(validationError);
          return;
        }

        let modelData;
        try {
          modelData = parseModelData(fileName, modelJson, undefined, undefined, undefined);
        } catch (parseError) {
          // Parsing failed - provide helpful context
          console.error('Parse error:', parseError);
          const contextInfo = getJsonContext(modelJson);
          setErrorState(formatError(parseError, contextInfo, fileName));
          return;
        }

        modelData.sites = modelJson.metadata.sites;
        setModelData({modelData, sites: modelJson.metadata.sites, name: fileName, error: undefined});
      } catch (err) {
        setErrorState(`Error during file reading / parsing: ${err.message}\n\nStack trace:\n${err.stack}`);
      }
      // Reset the input so the same file can be selected again
      event.target.value = '';
    },
    [setErrorState, setModelData]
  );

  useEffect(() => {
    // Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleFileChange);
    document.body.appendChild(fileInput);
    fileInputRef.current = fileInput;

    return () => {
      fileInput.removeEventListener('change', handleFileChange);
      document.body.removeChild(fileInput);
    };
  }, [handleFileChange]);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return triggerFileSelect;
}

/**
 * Formats an error message with context information for display
 */
function formatError(error, contextInfo, fileName) {
  const lines = [];

  lines.push("╔════════════════════════════════════════════════════════════════╗");
  lines.push("║                     PARSING ERROR                              ║");
  lines.push("╚════════════════════════════════════════════════════════════════╝");
  lines.push("");
  lines.push(`File: ${fileName}`);
  lines.push("");
  lines.push("─────────────────────────────────────────────────────────────────");
  lines.push("ERROR MESSAGE:");
  lines.push("─────────────────────────────────────────────────────────────────");
  lines.push(error.message);
  lines.push("");
  lines.push("─────────────────────────────────────────────────────────────────");
  lines.push("YOUR JSON STRUCTURE:");
  lines.push("─────────────────────────────────────────────────────────────────");
  lines.push(contextInfo);
  lines.push("");
  lines.push("─────────────────────────────────────────────────────────────────");
  lines.push("STACK TRACE:");
  lines.push("─────────────────────────────────────────────────────────────────");
  lines.push(error.stack);
  lines.push("");

  return lines.join('\n');
}

/**
 * Formats a simple error message for display
 */
function formatSimpleError(error, title) {
  const lines = [];

  lines.push("╔════════════════════════════════════════════════════════════════╗");
  lines.push("║                         ERROR                                  ║");
  lines.push("╚════════════════════════════════════════════════════════════════╝");
  lines.push("");
  lines.push(title);
  lines.push("");
  lines.push("─────────────────────────────────────────────────────────────────");
  lines.push("ERROR MESSAGE:");
  lines.push("─────────────────────────────────────────────────────────────────");
  lines.push(error.message);
  lines.push("");
  lines.push("─────────────────────────────────────────────────────────────────");
  lines.push("STACK TRACE:");
  lines.push("─────────────────────────────────────────────────────────────────");
  lines.push(error.stack);
  lines.push("");

  return lines.join('\n');
}

/**
 * Provides context information about the JSON to help with debugging
 */
function getJsonContext(modelJson) {
  const info = [];

  info.push("=== JSON Structure Summary ===");

  if (modelJson.metadata) {
    info.push("\nMetadata fields:");
    info.push(`  - sites: ${JSON.stringify(modelJson.metadata.sites)}`);
    info.push(`  - variants: ${JSON.stringify(modelJson.metadata.variants)}`);
    info.push(`  - location: ${JSON.stringify(modelJson.metadata.location)}`);
    info.push(`  - dates: ${Array.isArray(modelJson.metadata.dates) ? `${modelJson.metadata.dates.length} dates (${modelJson.metadata.dates[0]} to ${modelJson.metadata.dates[modelJson.metadata.dates.length-1]})` : 'not provided'}`);
    info.push(`  - forecast_dates: ${Array.isArray(modelJson.metadata.forecast_dates) ? `${modelJson.metadata.forecast_dates.length} dates` : 'not provided'}`);
    info.push(`  - pivot: ${modelJson.metadata.pivot || 'not specified (will use last variant)'}`);
    info.push(`  - updated: ${modelJson.metadata.updated || 'not provided'}`);
  }

  if (Array.isArray(modelJson.data)) {
    info.push(`\nData array: ${modelJson.data.length} data points`);

    // Show sample data points
    if (modelJson.data.length > 0) {
      info.push("\nFirst data point:");
      info.push(`  ${JSON.stringify(modelJson.data[0], null, 2).split('\n').join('\n  ')}`);

      // Count data points by site
      const siteCounts = {};
      modelJson.data.forEach(d => {
        siteCounts[d.site] = (siteCounts[d.site] || 0) + 1;
      });
      info.push("\nData points per site:");
      Object.entries(siteCounts).forEach(([site, count]) => {
        info.push(`  - ${site}: ${count} points`);
      });

      // Check for missing required fields in data
      const fieldsInFirstPoint = Object.keys(modelJson.data[0]);
      info.push(`\nFields in first data point: ${fieldsInFirstPoint.join(', ')}`);
    }
  }

  return info.join('\n');
}

/**
 * Validates the structure of the model JSON before parsing
 * Returns an error message string if validation fails, or null if valid
 */
function validateModelJson(modelJson) {
  if (!modelJson || typeof modelJson !== 'object') {
    return 'Invalid JSON: The file does not contain a valid JSON object.';
  }

  if (!modelJson.metadata) {
    return 'Invalid JSON structure: Missing required "metadata" field at the top level.\n\nExpected structure:\n{\n  "metadata": {...},\n  "data": [...]\n}';
  }

  const metadata = modelJson.metadata;
  const missingFields = [];

  if (!Array.isArray(metadata.sites)) {
    missingFields.push('"metadata.sites" (array)');
  }
  if (!Array.isArray(metadata.variants)) {
    missingFields.push('"metadata.variants" (array)');
  }
  if (!metadata.location) {
    missingFields.push('"metadata.location" (string or array)');
  }
  if (!Array.isArray(metadata.dates) && !Array.isArray(metadata.forecast_dates)) {
    missingFields.push('"metadata.dates" or "metadata.forecast_dates" (at least one array)');
  }

  if (missingFields.length > 0) {
    return `Invalid JSON structure: Missing required fields in metadata:\n  - ${missingFields.join('\n  - ')}\n\nYour JSON has these metadata fields: ${Object.keys(metadata).join(', ')}`;
  }

  if (!Array.isArray(modelJson.data)) {
    return 'Invalid JSON structure: Missing or invalid "data" field (expected an array).\n\nExpected structure:\n{\n  "metadata": {...},\n  "data": [{...}, {...}, ...]\n}';
  }

  if (modelJson.data.length === 0) {
    return 'Invalid JSON: The "data" array is empty. Please provide model data.';
  }

  // Check a few data points for required fields
  const sampleDataPoint = modelJson.data[0];
  const dataPointMissingFields = [];
  if (!sampleDataPoint.site) dataPointMissingFields.push('site');
  if (!sampleDataPoint.location) dataPointMissingFields.push('location');
  if (!sampleDataPoint.variant) dataPointMissingFields.push('variant');
  if (sampleDataPoint.value === undefined) dataPointMissingFields.push('value');

  if (dataPointMissingFields.length > 0) {
    return `Invalid data point structure: The first data point is missing required fields:\n  - ${dataPointMissingFields.join('\n  - ')}\n\nExpected data point structure:\n{\n  "site": "...",\n  "location": "...",\n  "variant": "...",\n  "value": ...,\n  ...\n}\n\nFirst data point has: ${Object.keys(sampleDataPoint).join(', ')}`;
  }

  return null; // Validation passed
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

