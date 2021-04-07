// import "./wdyr";
// eslint-disable-next-line no-use-before-define
import React from "react";
import ReactDOM from "react-dom";
import electron from "electron";
import { BrowserRouter as Router } from "react-router-dom";

import { Provider } from "react-redux";
import App from "./components/App";
import Overlay from "./overlay";
import store from "./redux/stores/rendererStore";
import "./index.scss";

import * as serviceWorker from "./serviceWorker";
import defaultLocalSettings from "./utils/defaultLocalSettings";
import backgroundChannelListeners from "./broadcastChannel/backgroundChannelListeners";
import mainChannelListeners from "./broadcastChannel/mainChannelListeners";
import overlayChannelListeners from "./broadcastChannel/overlayChannelListeners";
import { loadDbFromCache } from "./utils/database-wrapper";

const title = electron.remote.getCurrentWindow().getTitle();
loadDbFromCache();

if (title == "mtgatool-background") {
  if (module.hot && process.env.NODE_ENV === "development") {
    module.hot.accept();
  }
  backgroundChannelListeners();
} else if (title == "mtgatool-overlay") {
  defaultLocalSettings();
  overlayChannelListeners();
  ReactDOM.render(
    <React.StrictMode>
      <Overlay />
    </React.StrictMode>,
    document.getElementById("root")
  );

  if (module.hot && process.env.NODE_ENV === "development") {
    module.hot.accept();
    // eslint-disable-next-line global-require
    const NextOverlay = require("./overlay/index").default;
    ReactDOM.render(
      <React.StrictMode>
        <NextOverlay />
      </React.StrictMode>,
      document.getElementById("root")
    );
  }
} else {
  defaultLocalSettings();
  mainChannelListeners();
  ReactDOM.render(
    <React.StrictMode>
      <Provider store={store}>
        <Router>
          <App />
        </Router>
      </Provider>
    </React.StrictMode>,
    document.getElementById("root")
  );

  if (module.hot && process.env.NODE_ENV === "development") {
    module.hot.accept();
    // eslint-disable-next-line global-require
    const NextApp = require("./components/App").default;
    ReactDOM.render(
      <React.StrictMode>
        <Provider store={store}>
          <Router>
            <NextApp />
          </Router>
        </Provider>
      </React.StrictMode>,
      document.getElementById("root")
    );
  }
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
