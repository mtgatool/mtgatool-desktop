/* eslint-disable import/no-webpack-loader-syntax */
/* eslint-disable no-nested-ternary */
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { LOGIN_OK } from "mtgatool-shared/dist/shared/constants";
import { Switch, Route, useHistory } from "react-router-dom";

import { remote } from "electron";
import Auth from "./Auth";
import CardHover from "./CardHover";
import ErrorBoundary from "./ErrorBoundary";
import LoadingBar from "./LoadingBar";
import TopBar from "./TopBar";
import TopNav from "./TopNav";

import { AppState } from "../redux/stores/rendererStore";
import { useGun, useSea } from "../gun/hooks";
import ContentWrapper from "./ContentWrapper";

function App() {
  useGun();
  useSea();
  const history = useHistory();

  const { loginState, topArtist, offline, loading } = useSelector(
    (state: AppState) => state.renderer
  );

  useEffect(() => {
    history.push("/auth");
  }, []);

  return (
    <>
      {process.platform !== "linux" && (
        <TopBar artist={topArtist} offline={offline} />
      )}
      <div
        className={
          process.platform == "linux"
            ? loginState == LOGIN_OK
              ? "app-wrapper-no-frame"
              : "app-wrapper-back-no-frame"
            : loginState == LOGIN_OK
            ? "app-wrapper"
            : "app-wrapper-back"
        }
      >
        <CardHover />
        {loading ? (
          <LoadingBar
            style={
              loginState == LOGIN_OK || process.platform == "linux"
                ? { top: process.platform !== "linux" ? "72px" : "0px" }
                : {}
            }
          />
        ) : (
          <></>
        )}
        <ErrorBoundary>
          <Switch>
            <Route exact path="/auth" component={Auth} />
            <Route path="/:page">
              <>
                <TopNav />
                <ContentWrapper />
              </>
            </Route>
          </Switch>
        </ErrorBoundary>
        <div className="version-number">v{remote.app.getVersion()}</div>
      </div>
    </>
  );
}

export default App;
