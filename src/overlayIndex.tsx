/**
 * Slim entry for the "look past the game" windows: card hover, the match
 * overlays and the post-match overview.
 *
 * These windows load `overlay.html`, not `index.html`, so their renderer never
 * pulls in the main-app graph — App and its views, the router, the log watcher
 * and GRE parser (`backgroundChannelListeners`), the memory reader, the cloud
 * sync in `mainChannelListeners`, the updater. That whole tree is reachable
 * only from `electronIndex`, so webpack keeps it out of the chunks this HTML
 * loads. The point is memory: each of these is a separate Chromium renderer,
 * and an overlay has no use for any of it.
 *
 * Window role is still chosen by BrowserWindow title, exactly as in
 * electronIndex — the difference is only which HTML/entry a window loads.
 */
import "./index.scss";

// eslint-disable-next-line no-use-before-define
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import Hover from "./hover";
import Overlay from "./overlay";
import PostMatch from "./postmatch";
import reduxAction from "./redux/reduxAction";
import store from "./redux/stores/rendererStore";
import * as serviceWorker from "./serviceWorker";
import { WINDOW_HOVER, WINDOW_POSTMATCH } from "./types/app";
import cardsDb from "./utils/cardsDb/cardsDbClient";
import defaultLocalSettings from "./utils/defaultLocalSettings";
import getWindowTitle from "./utils/electron/getWindowTitle";

const title = getWindowTitle();

defaultLocalSettings();

function windowFor(t: string): JSX.Element {
  if (t === WINDOW_HOVER) return <Hover />;
  if (t === WINDOW_POSTMATCH) return <PostMatch />;
  // Anything else loading this HTML is one of the WINDOW_OVERLAY_<id> windows.
  return <Overlay />;
}

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>{windowFor(title)}</Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

if (module.hot && process.env.NODE_ENV === "development") {
  module.hot.accept();
}

// Proxy mode: overlay/hover/post-match windows don't own the SQLite worker,
// they query the background window's over the broadcast channel — see
// cardsDbClient. init() is still called so the eager lookup tables load.
cardsDb.init().then((ready) => {
  if (ready) {
    reduxAction(store.dispatch, { type: "FORCE_COLLECTION", arg: undefined });
  }
});

serviceWorker.unregister();
