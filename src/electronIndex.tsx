// import "./wdyr";
import "./index.scss";

import { createBrowserHistory } from "history";
// eslint-disable-next-line no-use-before-define
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Router } from "react-router-dom";

import backgroundChannelListeners from "./broadcastChannel/backgroundChannelListeners";
import mainChannelListeners from "./broadcastChannel/mainChannelListeners";
import App from "./components/App";
import Hover from "./hover";
import Overlay from "./overlay";
import PostMatch from "./postmatch";
import reduxAction from "./redux/reduxAction";
import store from "./redux/stores/rendererStore";
import * as serviceWorker from "./serviceWorker";
import {
  ALL_OVERLAYS,
  WINDOW_BACKGROUND,
  WINDOW_HOVER,
  WINDOW_POSTMATCH,
  WINDOW_UPDATER,
} from "./types/app";
import Updater from "./updater";
import cardsDb from "./utils/cardsDb/cardsDbClient";
import defaultLocalSettings from "./utils/defaultLocalSettings";
import getWindowTitle from "./utils/electron/getWindowTitle";
import getLocalSetting from "./utils/getLocalSetting";
import initDirectories from "./utils/initDirectories";
import registerShortcuts from "./utils/registerShortcuts";

// tool-db removed — the p2p worker is no longer created. Data now lives in the
// local IndexedDB store (src/data) and syncs to Supabase.

const title = getWindowTitle();

// Kept on `window` so a hot update reuses the same instance. Re-executing this
// module would otherwise mint a second history, and React Router v5 refuses to
// swap the one it listens on ("You cannot change <Router history>") while still
// handing the new one to useHistory consumers — pushes then move the URL and
// the router never hears about it, so navigation dies until a full reload with
// no error to explain it. Identical behaviour in production, where this module
// only ever runs once.
const history =
  window.__mtgaHistory || (window.__mtgaHistory = createBrowserHistory());

if (title == WINDOW_UPDATER) {
  ReactDOM.render(
    <React.StrictMode>
      <Updater />
    </React.StrictMode>,
    document.getElementById("root")
  );
} else if (title == WINDOW_BACKGROUND) {
  initDirectories();
  if (module.hot && process.env.NODE_ENV === "development") {
    module.hot.accept();
  }
  backgroundChannelListeners();
  // This window owns the SQLite worker; answer proxy windows (overlays, hover,
  // post-match) so they don't each load their own 17MB copy of the database.
  cardsDb.serveRemoteRequests();
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
} else if (title == WINDOW_POSTMATCH) {
  defaultLocalSettings();
  ReactDOM.render(
    <React.StrictMode>
      <Provider store={store}>
        <PostMatch />
      </Provider>
    </React.StrictMode>,
    document.getElementById("root")
  );

  if (module.hot && process.env.NODE_ENV === "development") {
    module.hot.accept();
    // eslint-disable-next-line global-require
    const NextPostMatch = require("./postmatch/index").default;
    ReactDOM.render(
      <React.StrictMode>
        <Provider store={store}>
          <NextPostMatch />
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
  defaultLocalSettings();

  const settings = JSON.parse(getLocalSetting("settings"));
  registerShortcuts(settings);

  mainChannelListeners();
  ReactDOM.render(
    <React.StrictMode>
      <Provider store={store}>
        <Router history={history}>
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
          <Router history={history}>
            <NextApp />
          </Router>
        </Provider>
      </React.StrictMode>,
      document.getElementById("root")
    );
  }
}

if (title !== WINDOW_UPDATER) {
  // Every window that shows cards needs the database, and each owns its own
  // worker: SharedWorker is unavailable under file://, so there is no way to
  // share one instance across windows in a packaged build.
  cardsDb.init().then((ready) => {
    if (ready) {
      reduxAction(store.dispatch, { type: "FORCE_COLLECTION", arg: undefined });
    }
  });
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
