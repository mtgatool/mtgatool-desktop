// import "./wdyr";
import "./index.scss";

import * as Sentry from "@sentry/react";
import { createBrowserHistory } from "history";
// eslint-disable-next-line no-use-before-define
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Router } from "react-router-dom";

import mainChannelListeners from "./broadcastChannel/mainChannelListeners";
import App from "./components/App";
import reduxAction from "./redux/reduxAction";
import store from "./redux/stores/rendererStore";
import routes from "./routes";
import * as serviceWorker from "./serviceWorker";
import { loadDbFromCache } from "./utils/database-wrapper";
import defaultLocalSettings from "./utils/defaultLocalSettings";
import getLocalSetting from "./utils/getLocalSetting";

window.toolDbWorker = new Worker(
  `${window.location.origin}/tooldb-worker/index.js`,
  {
    type: "module",
  }
);

document.title = "MTG Arena Tool";

const history = createBrowserHistory();

Sentry.init({
  dsn: "https://4ec87bda1b064120a878eada5fc0b10f@o311116.ingest.sentry.io/1778171",
  integrations: [
    new Sentry.BrowserProfilingIntegration(),
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV5Instrumentation(
        history,
        routes
      ),
    }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  tracesSampleRate: 1.0,

  // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

defaultLocalSettings();
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

loadDbFromCache(getLocalSetting("lang")).then(() =>
  reduxAction(store.dispatch, { type: "FORCE_COLLECTION", arg: undefined })
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
