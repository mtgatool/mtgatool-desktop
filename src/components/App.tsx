/* eslint-disable import/no-webpack-loader-syntax */
/* eslint-disable no-nested-ternary */
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LOGIN_OK } from "mtgatool-shared/dist/shared/constants";
import { Switch, Route, useHistory } from "react-router-dom";

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

import { useGun, useSea } from "../gun/hooks";
import doWebLogin from "../gun/doWebLogin";
import login from "../gun/login";
import reduxAction from "../redux/reduxAction";
import PopupComponent from "./PopupComponent";
import vodiFn from "../utils/voidfn";
import ViewSettings from "./views/settings/ViewSettings";
import SettingsPersistor from "./SettingsPersistor";
import isElectron from "../utils/electron/isElectron";

import info from "../info.json";

function App() {
  useGun();
  useSea();
  const history = useHistory();
  const dispatch = useDispatch();

  const { loginState, loading, backgroundGrpid } = useSelector(
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

          history.push("/auth");
        })
        .catch(() => {
          history.push("/auth");
        });
    } else {
      history.push("/auth");
    }
  }, [history, dispatch]);

  let wrapperClass = "app-wrapper-back";
  if (process.platform == "linux" || electron) {
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
      {electron && process.platform !== "linux" && <TopBar />}
      <div
        className={wrapperClass}
        style={{
          height: `calc(100% - ${electron ? 24 : 0}px)`,
          backgroundImage: backgroundImage,
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
                <TopNav openSettings={openSettings.current} />
                {loginState == LOGIN_OK ? <ContentWrapper /> : <></>}
              </>
            </Route>
          </Switch>
        </ErrorBoundary>
        {loginState == LOGIN_OK ? <DataStatus /> : <></>}
        {electron ? (
          <div className="version-number">v{info.version}</div>
        ) : (
          <></>
        )}
      </div>
    </>
  );
}

export default App;
