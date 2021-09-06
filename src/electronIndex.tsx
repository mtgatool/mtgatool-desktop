// import "./wdyr";
// eslint-disable-next-line no-use-before-define
import React from "react";
import ReactDOM from "react-dom";

import { BrowserRouter as Router } from "react-router-dom";

import { Provider } from "react-redux";
import { ToolDbClient } from "tool-db";
import App from "./components/App";
import Overlay from "./overlay";
import Hover from "./hover";
import store from "./redux/stores/rendererStore";
import "./index.scss";

import * as serviceWorker from "./serviceWorker";
import defaultLocalSettings from "./utils/defaultLocalSettings";
import backgroundChannelListeners from "./broadcastChannel/backgroundChannelListeners";
import mainChannelListeners from "./broadcastChannel/mainChannelListeners";
import { loadDbFromCache } from "./utils/database-wrapper";
import initDirectories from "./utils/initDirectories";
import getWindowTitle from "./utils/electron/getWindowTitle";
import { ALL_OVERLAYS, WINDOW_BACKGROUND, WINDOW_HOVER } from "./types/app";
import { DB_SERVER } from "./constants";

const title = getWindowTitle();
loadDbFromCache();

if (title == WINDOW_BACKGROUND) {
  initDirectories();
  if (module.hot && process.env.NODE_ENV === "development") {
    module.hot.accept();
  }
  backgroundChannelListeners();
} else if (title == WINDOW_HOVER) {
  defaultLocalSettings();
  ReactDOM.render(
    <React.StrictMode>
      <Provider store={store}>
        <Hover />
      </Provider>
    </React.StrictMode>,
    document.getElementById("root")
  );

  if (module.hot && process.env.NODE_ENV === "development") {
    module.hot.accept();
    // eslint-disable-next-line global-require
    const NextHover = require("./hover/index").default;
    ReactDOM.render(
      <React.StrictMode>
        <Provider store={store}>
          <NextHover />
        </Provider>
      </React.StrictMode>,
      document.getElementById("root")
    );
  }
} else if (ALL_OVERLAYS.includes(title)) {
  defaultLocalSettings();
  ReactDOM.render(
    <React.StrictMode>
      <Provider store={store}>
        <Overlay />
      </Provider>
    </React.StrictMode>,
    document.getElementById("root")
  );

  if (module.hot && process.env.NODE_ENV === "development") {
    module.hot.accept();
    // eslint-disable-next-line global-require
    const NextOverlay = require("./overlay/index").default;
    ReactDOM.render(
      <React.StrictMode>
        <Provider store={store}>
          <NextOverlay />
        </Provider>
      </React.StrictMode>,
      document.getElementById("root")
    );
  }
} else {
  if (!window.toolDb) {
    window.toolDb = new ToolDbClient(DB_SERVER);
    window.toolDb.debug = true;
  }

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
