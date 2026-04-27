import React from 'react';
import ReactDOM from 'react-dom/client';
import AppSC2 from './sarsCov2-testApp';
import DragAndDropApp from './dragAndDrop';

/**
 * To keep the overall test app simple we aren't providing a proper
 * SPA-routing solution - it's only intended for dev usage afterall.
 */
function Router() {
  switch(window.location.pathname.replace(/\/$/, '')) {
    case '': // e.g. localhost:3000
    case '/ncov':
      return <AppSC2/>;
    case "/dragdrop":
    case "/forecasts-viz": // e.g. https://nextstrain.github.io/forecasts-viz/
      return <DragAndDropApp/>;
    default:
      return <NoPageHere/>
  }
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router/>
  </React.StrictMode>
);

function NoPageHere() {
  return (
    <div id="AppContainer">
      <h1>No page here!</h1>
      <div className="abstract">
        {`See the page switch logic in ./src/index.js`}
      </div>
    </div>
  )
}
