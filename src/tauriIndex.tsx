import "./index.scss";

import { createBrowserHistory } from "history";
// eslint-disable-next-line no-use-before-define
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Router } from "react-router-dom";

import backgroundChannelListenersTauri from "./broadcastChannel/backgroundChannelListenersTauri";
import mainChannelListeners from "./broadcastChannel/mainChannelListeners";
import App from "./components/App";
import Hover from "./hover";
import Overlay from "./overlay";
import reduxAction from "./redux/reduxAction";
import store from "./redux/stores/rendererStore";
import * as serviceWorker from "./serviceWorker";
import { loadDbFromCache } from "./utils/database-wrapper";
import defaultLocalSettings from "./utils/defaultLocalSettings";
import getLocalSetting from "./utils/getLocalSetting";
import initDirectoriesTauri from "./utils/initDirectoriesTauri";
import registerShortcutsTauri from "./utils/registerShortcutsTauri";
import isTauri from "./utils/tauri/isTauri";

// Only run in Tauri environment
if (isTauri()) {
  console.log("[Tauri] Initializing Tauri app...");

  try {
    // Web worker for tooldb
    try {
      window.toolDbWorker = new Worker("tooldb-worker/index.js", {
        type: "module",
      });
      console.log("[Tauri] Worker initialized successfully");
    } catch (error) {
      console.error("[Tauri] Failed to initialize worker:", error);
      throw error;
    }

    const history = createBrowserHistory();

    // Get window label from Tauri - use synchronous access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const label = (window as any).__TAURI__?.window?.appWindow?.label || "main";
    console.log("[Tauri] Window label:", label);

    // Route based on window label
    if (label === "background") {
      // Background window - no React rendering, just listeners
      console.log("[Tauri] Initializing background window...");
      initDirectoriesTauri();
      backgroundChannelListenersTauri();

      if (module.hot && process.env.NODE_ENV === "development") {
        module.hot.accept();
      }
    } else if (label === "hover") {
      // Hover window - card preview
      console.log("[Tauri] Initializing hover window...");
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
    } else if (label.startsWith("overlay-")) {
      // Overlay windows
      console.log("[Tauri] Initializing overlay window...");
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
      // Main window
      console.log("[Tauri] Initializing main window...");
      defaultLocalSettings();

      try {
        const settingsStr = getLocalSetting("settings");
        const settings = JSON.parse(settingsStr);
        registerShortcutsTauri(settings);
        console.log("[Tauri] Settings loaded and shortcuts registered");
      } catch (error) {
        console.error(
          "[Tauri] Failed to parse settings, using defaults:",
          error
        );
        // Use default settings if parsing fails
        try {
          registerShortcutsTauri({});
        } catch (shortcutError) {
          console.error("[Tauri] Failed to register shortcuts:", shortcutError);
        }
      }

      mainChannelListeners();
      console.log("[Tauri] Rendering main App component...");
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

    // Load database cache for all windows except updater (which doesn't exist in Tauri)
    console.log("[Tauri] Loading database cache...");
    loadDbFromCache(getLocalSetting("lang"))
      .then(() => {
        console.log("[Tauri] Database cache loaded");
        reduxAction(store.dispatch, {
          type: "FORCE_COLLECTION",
          arg: undefined,
        });
      })
      .catch((error) => {
        console.error("[Tauri] Failed to load database cache:", error);
      });

    serviceWorker.unregister();
    console.log("[Tauri] Initialization complete");
  } catch (error) {
    console.error("[Tauri] Fatal error during initialization:", error);
    throw error;
  }
} else {
  console.log(
    "[Tauri] Not running in Tauri environment, skipping Tauri initialization"
  );
}
