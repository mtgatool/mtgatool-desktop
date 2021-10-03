/* eslint-disable import/no-webpack-loader-syntax */
/* eslint-disable no-nested-ternary */
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LOGIN_OK } from "mtgatool-shared/dist/shared/constants";
import { Switch, Route, useHistory } from "react-router-dom";

import { ToolDbClient } from "tool-db";

import Auth from "./Auth";
import CardHover from "./CardHover";
import ContentWrapper from "./ContentWrapper";
import DataStatus from "./DataStatus";
import ErrorBoundary from "./ErrorBoundary";
import LoadingBar from "./LoadingBar";
import TopBar from "./TopBar";
import TopNav from "./TopNav";

import { AppState } from "../redux/stores/rendererStore";
import electron from "../utils/electron/electronWrapper";
import getLocalSetting from "../utils/getLocalSetting";
import { getCardArtCrop } from "../utils/getCardArtCrop";

import reduxAction from "../redux/reduxAction";
import PopupComponent from "./PopupComponent";
import vodiFn from "../utils/voidfn";
import ViewSettings from "./views/settings/ViewSettings";
import SettingsPersistor from "./SettingsPersistor";
import isElectron from "../utils/electron/isElectron";

import info from "../info.json";
import overlayHandler from "../common/overlayHandler";
import login from "../toolDb/login";
import { DEFAULT_SERVERS } from "../constants";
import Welcome from "./Welcome";
import liveDraftVerification from "../toolDb/liveDraftVerification";
import { DbMatch } from "../types/dbTypes";
import incomingLiveFeed from "../toolDb/incomingLiveFeed";
import getGunDb from "../toolDb/getGunDb";

export interface AppProps {
  forceOs?: string;
}

function App(props: AppProps) {
  const { forceOs } = props;
  const history = useHistory();
  const dispatch = useDispatch();

  const { loginState, loading, backgroundGrpid, matchInProgress, peers } =
    useSelector((state: AppState) => state.renderer);

  const os = forceOs || (electron ? process.platform : "");

  useEffect(() => {
    if (!window.toolDbInitialized) {
      const storedPeers = JSON.parse(getLocalSetting("peers"));
      const mergedPeers = [
        ...storedPeers.map((p: string) => `http://${p}:8765/gun`),
        ...DEFAULT_SERVERS,
      ];
      window.toolDb = new ToolDbClient(mergedPeers);
      window.toolDbInitialized = true;
      window.toolDb.debug = true;
      window.toolDb.addCustomVerification(
        "live-draft-v1-",
        liveDraftVerification
      );

      window.toolDb.addKeyListener<DbMatch | null>(
        "matches-livefeed",
        incomingLiveFeed
      );
      getGunDb();
    }
  }, [peers]);

  useEffect(() => {
    if (overlayHandler) {
      overlayHandler.settingsUpdated();
    }
  }, [matchInProgress]);

  useEffect(() => {
    const welcome = getLocalSetting("welcome");
    if (!welcome || welcome === "false") {
      history.push("/welcome");
    } else if (!electron) {
      const pwd = getLocalSetting("savedPassword");
      const user = getLocalSetting("username");

      login(user, pwd)
        .then(async () => {
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
        .catch((e) => {
          console.error(e);
          history.push("/auth");
        });
    } else {
      history.push("/auth");
    }
  }, [history, dispatch]);

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
      {os !== "" && os !== "linux" && <TopBar forceOs={os} />}
      <div
        className={wrapperClass}
        style={{
          height: `calc(100% - ${os !== "" && os !== "linux" ? 24 : 0}px)`,
          backgroundImage: backgroundImage,
        }}
      >
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
                <TopNav openSettings={openSettings.current} />
                {loginState == LOGIN_OK ? <ContentWrapper /> : <></>}
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
