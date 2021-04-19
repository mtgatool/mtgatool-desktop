/* eslint-disable import/no-webpack-loader-syntax */
/* eslint-disable no-nested-ternary */
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LOGIN_OK } from "mtgatool-shared/dist/shared/constants";
import { Switch, Route, useHistory } from "react-router-dom";

import Auth from "./Auth";
import CardHover from "./CardHover";
import ErrorBoundary from "./ErrorBoundary";
import LoadingBar from "./LoadingBar";
import TopBar from "./TopBar";
import TopNav from "./TopNav";

import { AppState } from "../redux/stores/rendererStore";
import { useGun, useSea } from "../gun/hooks";
import ContentWrapper from "./ContentWrapper";
import electron from "../utils/electron/electronWrapper";
import getLocalSetting from "../utils/getLocalSetting";
import login from "../gun/login";
import reduxAction from "../redux/reduxAction";
import doWebLogin from "../gun/doWebLogin";

function App() {
  useGun();
  useSea();
  const history = useHistory();
  const dispatch = useDispatch();

  const { loginState, topArtist, offline, loading } = useSelector(
    (state: AppState) => state.renderer
  );

  useEffect(() => {
    if (!electron) {
      const pwd = getLocalSetting("savedPassword");
      const user = getLocalSetting("username");

      login(user, pwd)
        .then(async () => {
          await doWebLogin();
          reduxAction(dispatch, {
            type: "SET_LOGIN_STATE",
            arg: LOGIN_OK,
          });
        })
        .catch(() => {
          history.push("/auth");
        });
    } else {
      history.push("/auth");
    }
  }, [history, dispatch]);

  return (
    <>
      {electron && process.platform !== "linux" && (
        <TopBar artist={topArtist} loginState={loginState} offline={offline} />
      )}
      <div
        className={
          process.platform == "linux" || electron
            ? loginState == LOGIN_OK
              ? "app-wrapper-back-no-frame"
              : "app-wrapper-back-no-frame"
            : loginState == LOGIN_OK
            ? "app-wrapper-back"
            : "app-wrapper-back"
        }
        style={{
          height: `calc(100% - ${electron ? 24 : 0}px)`,
        }}
      >
        <CardHover />
        {loading ? (
          <LoadingBar
            style={
              loginState == LOGIN_OK || process.platform == "linux"
                ? {
                    top: process.platform !== "linux" ? "72px" : "0px",
                  }
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
                {loginState == LOGIN_OK ? <ContentWrapper /> : <></>}
              </>
            </Route>
          </Switch>
        </ErrorBoundary>
        {electron ? (
          <div className="version-number">
            v{electron.remote.app.getVersion()}
          </div>
        ) : (
          <></>
        )}
      </div>
    </>
  );
}

export default App;
