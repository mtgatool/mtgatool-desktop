import "./index.scss";

import { PhysicalSize } from "@tauri-apps/api/dpi";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { createBrowserHistory } from "history";
// eslint-disable-next-line no-use-before-define
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Router } from "react-router-dom";

import backgroundChannelListenersTauri from "./broadcastChannel/backgroundChannelListenersTauri";
import mainChannelListeners from "./broadcastChannel/mainChannelListeners";
import { defaultConfig } from "./common/defaultConfig";
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

const appWindow = getCurrentWebviewWindow();

// Make an overlay/hover window frameless + transparent from its OWN context.
// This is more reliable than the WebviewWindow creation options:
//  - setDecorations(false) at runtime reliably removes the title bar even when
//    the creation-time `decorations` flag is ignored on Windows.
//  - The transparent-window-shows-white bug (tauri#4881, upstream in wry/tao)
//    only clears after a resize forces a repaint, so we nudge the size by 1px
//    and back once the window is on screen. This mimics the manual
//    shrink/enlarge that currently fixes it.
async function makeWindowFramelessTransparent(): Promise<void> {
  document.documentElement.style.background = "transparent";
  document.body.style.background = "transparent";
  try {
    await appWindow.setDecorations(false);
  } catch (e) {
    console.error("[Tauri] setDecorations(false) failed:", e);
  }
  // Delay the repaint nudge until after the window is shown (createOverlay
  // shows it ~250ms after creation) so the resize actually forces a redraw.
  setTimeout(() => {
    appWindow
      .innerSize()
      .then((size) =>
        appWindow
          .setSize(new PhysicalSize(size.width + 1, size.height))
          .then(() => appWindow.setSize(size))
      )
      .catch((e) =>
        console.error("[Tauri] transparency repaint nudge failed:", e)
      );
  }, 500);
}

// Only run in Tauri environment
if (isTauri()) {
  console.log("[Tauri] Initializing Tauri app...");

  try {
    const history = createBrowserHistory();

    // Window label from the Tauri API (reliable per-window). The old
    // window.__TAURI__?.window?.appWindow?.label path was undefined in this
    // build and fell back to "main" for EVERY window — so the background
    // window rendered the app instead of starting the log watcher.
    const { label } = appWindow;
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
      // Hover window - card preview (borderless + transparent)
      console.log("[Tauri] Initializing hover window...");
      makeWindowFramelessTransparent();
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
      // Overlay windows (borderless + transparent)
      console.log("[Tauri] Initializing overlay window...");
      makeWindowFramelessTransparent();
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
          registerShortcutsTauri(defaultConfig);
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
