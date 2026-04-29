import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PanelDisplay } from '../src/lib/index.js';
import { ControlsProvider } from '../src/lib/hooks/ControlsContext.tsx';
import { parseModelData } from '../src/lib/utils/parse.ts'; // Note - not exposed by the library itself...
import type { ModelData } from '../src/lib/utils/modelData.types.ts';


type ModelJson = any;
type AppData = {
  modelData: ModelData;
  sites: string[];
  name: string;
  error: undefined;
};
type SetAppData = React.Dispatch<React.SetStateAction<AppData | undefined>>;
type SetErrorState = React.Dispatch<React.SetStateAction<string | undefined>>;

function buildParserConfig(modelName: string) {
  return {
    modelName,
    modelUrl: modelName,
    sites: undefined,
  };
}

function App() {
  const [errorState, setErrorState] = useState<string | undefined>(undefined);
  const [appData, setAppData] = useState<AppData | undefined>(undefined);

  const fetchProgress = useUrlDefinedDataset(setAppData, setErrorState);
  /* TODO - if we use this in production, there's a race condition if
  you try to fetch & drag-on a JSON at the ~same time */
  useListeners(setAppData, setErrorState);

  if (errorState) {
    return <ErrorDisplay errorState={errorState}/>
  }
  if (!appData) {
    if (fetchProgress !== null) {
      return <Loading message={fetchProgress} />
    }
    return <Splash setAppData={setAppData} setErrorState={setErrorState} />;
  }
  return (
    <ControlsProvider>
      <div id="AppContainer">
        <h1>{`Forecasting-viz preview for '${appData.name}'`}</h1>
        {appData.modelData?.get('updated') &&
          <div className="abstract">
            {`Model updated ${appData?.modelData?.get('updated')}`}
          </div>}
        <div id="mainPanelsContainer" >
          {appData.sites.filter((site) => !site.endsWith('_forecast')).map((site) => {
            const preset = getPreset(site);
            if (!preset) {
              return (
                <h2 key={site}>{`Site ${site} doesn't (yet) have a graph preset`}</h2>
              );
            }
            return (
              <div key={site + preset}>
                <h2>{`Site ${site} / Graph preset ${preset}`}</h2>
                <PanelDisplay data={appData} params={{ preset }} />
              </div>
            );
          })}
        </div>
      </div>
    </ControlsProvider>
  );
}

export default App;

function getPreset(site: string) {
  if (site === 'freq') return 'frequency';
  if (site === 'R') return 'R_t';
  if (site === 'I_smooth') return 'stackedIncidence';
  if (site === 'ga') return 'growthAdvantage';
  return undefined;
}

function useListeners(setAppData: SetAppData, setErrorState: SetErrorState) {
  const handleDragover = useCallback(
    (event: DragEvent) => { event.preventDefault(); },
    [],
  );
  const handleDrop = useCallback(
    async (event: DragEvent) => {
      setErrorState('');
      event.preventDefault();
      const files = event.dataTransfer?.files;
      if (!files || files.length !== 1) {
        setErrorState(`Only one JSON can be used at a time, not ${files?.length ?? 0}.`);
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

        let modelData: ModelData;
        try {
          modelData = parseModelData(buildParserConfig(fileName), modelJson);
        } catch (parseError) {
          // Parsing failed - provide helpful context
          console.error('Parse error:', parseError);
          setErrorState(formatError(parseError, fileName));
          return;
        }
        setAppData({ modelData, sites: modelJson.metadata.sites, name: fileName, error: undefined });
      } catch (err) {
        setErrorState(formatSimpleError(err, 'Error during file reading / parsing'));
      }
    }, [setErrorState, setAppData],
  );
  useEffect(
    () => {
      document.addEventListener('dragover', handleDragover, false);
      document.addEventListener('drop', handleDrop, false);
      return () => {
        document.removeEventListener('dragover', handleDragover, false);
        document.removeEventListener('drop', handleDrop, false);
      };
    },
    [handleDragover, handleDrop],
  );
}

function useUrlDefinedDataset(setAppData: SetAppData, setErrorState: SetErrorState) {
  const [fetchProgress, setFetchProgress] = useState<string | null>(null);
  useEffect(
    () => {
      const datasetQuery = (new URL(window.location.href)).searchParams.get('dataset');
      if (!datasetQuery) return; // no URL-defined dataset implies drag & drop usage
      let datasetUrl: URL;
      try {
        datasetUrl = new URL(datasetQuery);
      } catch (err) {
        setErrorState(`Error while trying to parse the actual URL provided via the URL dataset query param: ${getErrorMessage(err)}`);
        return;
      }
      setFetchProgress(`Fetching ${datasetUrl}`);
      fetch(
        datasetUrl,
        { method: 'GET', mode: 'cors', credentials: 'omit', redirect: 'follow' },
      ).catch((err) => {
        setErrorState(`Error while trying to fetch the URL provided via the URL dataset query param: ${getErrorMessage(err)}`);
        return Promise.reject(null);
      })
        .then((response) => {
          if (response.status === 200) {
            setFetchProgress(`Fetched ${datasetUrl}. Parsing file...`);
            return response;
          }
          setErrorState(`Response status code ${response.status} while trying to fetch the URL provided via the URL dataset query param.`);
          return Promise.reject(null);
        })
        .then((response) => response.json())
        .then((modelJson: ModelJson) => {
          // Validate JSON structure before parsing
          const validationError = validateModelJson(modelJson);
          if (validationError) {
            setErrorState(`Successfully fetched the file at ${datasetUrl}, but the JSON structure is invalid:\n\n${validationError}`);
            return;
          }

          let modelData: ModelData;
          try {
            modelData = parseModelData(buildParserConfig(datasetUrl.toString()), modelJson);
          } catch (parseError) {
            // Parsing failed - provide helpful context
            setErrorState(formatError(parseError, datasetUrl));
            return;
          }
          setAppData({ modelData, sites: modelJson.metadata.sites, name: datasetUrl.toString(), error: undefined });
        }).catch((err) => {
          if (err) {
            setErrorState(formatSimpleError(err, `Successfully fetched the file at ${datasetUrl}, but there was an error when parsing the file contents`));
          }
        });
    }, [setAppData, setErrorState],
  );
  return fetchProgress;
}

function useFileSelect(setAppData: SetAppData, setErrorState: SetErrorState) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = useCallback(
    async (event: Event) => {
      setErrorState('');
      const target = event.target as HTMLInputElement | null;
      const files = target?.files;
      if (!files || files.length !== 1) {
        setErrorState(`Only one JSON can be used at a time, not ${files?.length ?? 0}.`);
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

        let modelData: ModelData;
        try {
          modelData = parseModelData(buildParserConfig(fileName), modelJson);
        } catch (parseError) {
          // Parsing failed - provide helpful context
          console.error('Parse error:', parseError);
          setErrorState(formatError(parseError, fileName));
          return;
        }
        setAppData({ modelData, sites: modelJson.metadata.sites, name: fileName, error: undefined });
      } catch (err) {
        setErrorState(`Error during file reading / parsing: ${getErrorMessage(err)}\n\nStack trace:\n${getErrorStack(err)}`);
      }
      // Reset the input so the same file can be selected again
      if (target) {
        target.value = '';
      }
    },
    [setErrorState, setAppData],
  );

  useEffect(() => {
    // Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleFileChange);
    document.body.appendChild(fileInput);
    fileInputRef.current = fileInput;

    return () => {
      fileInput.removeEventListener('change', handleFileChange);
      document.body.removeChild(fileInput);
    };
  }, [handleFileChange]);

  return useCallback(() => {
    fileInputRef.current?.click();
  }, []);
}

function readFile(file: File) {
  return new Promise<ModelJson>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          reject(new Error('File content was empty or not readable as text.'));
          return;
        }
        resolve(JSON.parse(content));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function validateModelJson(modelJson: ModelJson) {
  if (!modelJson || typeof modelJson !== 'object') {
    return 'File does not contain a valid JSON object.';
  }

  if (!modelJson.metadata || typeof modelJson.metadata !== 'object') {
    return 'Missing or invalid metadata object.';
  }

  if (!Array.isArray(modelJson.metadata.sites)) {
    return 'Missing or invalid metadata.sites array.';
  }

  return undefined;
}

function ErrorDisplay({ errorState }: { errorState: string }) {
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
          overflow: 'auto',
        }}
        >
          {errorState}
        </pre>
      </div>
    </div>
  );
}

function Splash({ setAppData, setErrorState }: { setAppData: SetAppData, setErrorState: SetErrorState }) {
  const handleFileSelect = useFileSelect(setAppData, setErrorState);
  return (
    <div id="AppContainer">
      <h1>Drag & drop a model JSON to visualise</h1>
      <div className="abstract">
        This is intended as a simple way to preview JSONs,
        <p />
        Or <button onClick={handleFileSelect} style={{ padding: '10px 20px', cursor: 'pointer' }}>Choose a file from Finder</button>
        <p />
        Alternatively, if your dataset is available via a URL, you can load it by adding the
        URL query parameter <code>?dataset=https://...</code> to the URL and reloading the page.
      </div>
    </div>
  )
}

function Loading({message}: {message:string}) {
  return (
    <div id="AppContainer">
      <h1>Loading dataset via URL</h1>
      <div className="abstract">
        {message}
      </div>
    </div>
  );
}


function formatError(error: unknown, contextName: string | URL) {
  return `${contextName}: ${getErrorMessage(error)}\n\nStack trace:\n${getErrorStack(error)}`;
}

function formatSimpleError(error: unknown, prefix: string) {
  return `${prefix}: ${getErrorMessage(error)}\n\nStack trace:\n${getErrorStack(error)}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function getErrorStack(error: unknown) {
  if (error instanceof Error && error.stack) {
    return error.stack;
  }
  return 'No stack trace available.';
}
