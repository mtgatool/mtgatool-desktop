/* eslint-disable import/no-webpack-loader-syntax */
/* eslint-disable no-nested-ternary */
import _ from "lodash";
import { sha1 } from "mtgatool-db";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, Switch, useHistory } from "react-router-dom";

import overlayHandler from "../common/overlayHandler";
import { LOGIN_OK } from "../constants";
import info from "../info.json";
import reduxAction from "../redux/reduxAction";
import { AppState } from "../redux/stores/rendererStore";
import { login } from "../toolDb/worker-wrapper";
import electron from "../utils/electron/electronWrapper";
import isElectron from "../utils/electron/isElectron";
import { getCardArtCrop } from "../utils/getCardArtCrop";
import getLocalSetting from "../utils/getLocalSetting";
import getPopupClass from "../utils/getPopupClass";
import vodiFn from "../utils/voidfn";
import Auth from "./Auth";
import CardHover from "./CardHover";
import ContentWrapper from "./ContentWrapper";
import DataStatus from "./DataStatus";
import ErrorBoundary from "./ErrorBoundary";
import LoadingBar from "./LoadingBar";
import PopupComponent from "./PopupComponent";
import Popups from "./Popups";
import ArenaIdSelector from "./popups/ArenaIdSelector";
import SettingsPersistor from "./SettingsPersistor";
import TopBar from "./TopBar";
import TopNav from "./TopNav";
import ViewSettings from "./views/settings/ViewSettings";
import Welcome from "./Welcome";

export interface AppProps {
  forceOs?: string;
}

function App(props: AppProps) {
  const { forceOs } = props;
  const history = useHistory();
  const dispatch = useDispatch();
  const [canLogin, _setCanLogin] = useState(true);

  const { loginState, loading, backgroundGrpid, matchInProgress } = useSelector(
    (state: AppState) => state.renderer
  );

  const os = forceOs || (isElectron() ? process.platform : "");

  useEffect(() => {
    window.toolDbWorker.addEventListener("message", (e) => {
      // console.warn("Worker REDUX_ACTION", action.type, action.arg);
      if (e.data.type === "REDUX_ACTION") {
        const action = e.data.arg;
        // console.warn("Worker REDUX_ACTION", action.type, action.arg);
        reduxAction(dispatch, {
          type: action.type,
          arg: action.arg,
        });
      }
      // lets experiment removing this
      // if (e.data.type === "CONNECTED") {
      //   setCanLogin(true);
      // }
    });
  }, []);

  useEffect(() => {
    if (overlayHandler) {
      overlayHandler.settingsUpdated();
    }
  }, [matchInProgress]);

  useEffect(() => {
    console.log("Can log in?", canLogin);
    const welcome = getLocalSetting("welcome");
    if (!welcome || welcome === "false") {
      history.push("/welcome");
    } else if (!electron && canLogin) {
      const pwd = getLocalSetting("savedPass");
      const user = getLocalSetting("username");

      login(user, sha1(pwd))
        .then(() => {
          reduxAction(dispatch, {
            type: "SET_LOGIN_STATE",
            arg: LOGIN_OK,
          });

          if (
            history.location.pathname === "" ||
            history.location.pathname === "/"
          ) {
            history.push("/auth");
          }
        })
        .catch((e: Error) => {
          console.error(e);
          history.push("/auth");
        });
    } else if (canLogin) {
      history.push("/auth");
    }
  }, [canLogin, history, dispatch]);

  let wrapperClass = "app-wrapper-back";
  if (os == "linux") {
    if (loginState == LOGIN_OK) {
      wrapperClass = "app-wrapper-back-no-frame";
    }
  }

  const backgroundImage = backgroundGrpid
    ? `url(${getCardArtCrop(backgroundGrpid)})`
    : undefined;

  const openSettings = useRef<() => void>(vodiFn);
  const closeSettings = useRef<() => void>(vodiFn);

  const openArenaIdSelector = useRef<() => void>(vodiFn);
  const closenArenaIdSelector = useRef<() => void>(vodiFn);

  return (
    <>
      <SettingsPersistor />
      <PopupComponent
        open={false}
        className={isElectron() ? "settings-popup" : ""}
        width="100%"
        height="100%"
        openFnRef={openSettings}
        closeFnRef={closeSettings}
        persistent={false}
      >
        <ViewSettings onClose={closeSettings.current} />
      </PopupComponent>
      <PopupComponent
        open={false}
        className={getPopupClass(os)}
        width="600px"
        height="400px"
        openFnRef={openArenaIdSelector}
        closeFnRef={closenArenaIdSelector}
        persistent={false}
      >
        <ArenaIdSelector onClose={closenArenaIdSelector.current} />
      </PopupComponent>
      {os !== "" && os !== "linux" && <TopBar forceOs={os} />}
      <div
        className={wrapperClass}
        style={{
          height: `calc(100% - ${os !== "" && os !== "linux" ? 24 : 0}px)`,
          backgroundImage: backgroundImage,
        }}
      >
        <Popups />
        <CardHover />
        {loading ? (
          <LoadingBar
            style={
              loginState == LOGIN_OK || os == "linux"
                ? {
                    top: os !== "linux" ? "72px" : "0px",
                  }
                : {}
            }
          />
        ) : (
          <></>
        )}
        <ErrorBoundary>
          <Switch>
            <Route exact path="/welcome" component={Welcome} />
            <Route exact path="/auth" component={Auth} />
            <Route path="/:page">
              <>
                <TopNav
                  openArenaIdSelector={openArenaIdSelector.current}
                  openSettings={openSettings.current}
                />
                {loginState == LOGIN_OK ? (
                  <ContentWrapper forceOs={forceOs} />
                ) : (
                  <></>
                )}
              </>
            </Route>
          </Switch>
        </ErrorBoundary>
        {loginState == LOGIN_OK ? <DataStatus /> : <></>}
        {os !== "" ? (
          <div className="version-number">v{info.version}</div>
        ) : (
          <></>
        )}
      </div>
    </>
  );
}

export default App;
