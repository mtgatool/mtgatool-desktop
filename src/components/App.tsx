/* eslint-disable import/no-webpack-loader-syntax */
/* eslint-disable no-nested-ternary */
import _ from "lodash";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Route, Switch, useHistory } from "react-router-dom";

import postChannelMessage from "../broadcastChannel/postChannelMessage";
import overlayHandler from "../common/overlayHandler";
import { LOGIN_OK } from "../constants";
import { loadLocalBackground } from "../data/backgroundStore";
import claimLocalStore from "../data/claimLocalStore";
import { getCloudSession } from "../data/cloudAuth";
import { getActiveUserId } from "../data/cloudSync";
import hydrateFromCloud from "../data/hydrateFromCloud";
import localLogin from "../data/localLogin";
import syncMatches from "../data/syncMatches";
import { useCardArtCrop } from "../hooks/useCardImage";
import info from "../info.json";
import reduxAction from "../redux/reduxAction";
import { AppState } from "../redux/stores/rendererStore";
import electron from "../utils/electron/electronWrapper";
import isElectron from "../utils/electron/isElectron";
import getLocalSetting from "../utils/getLocalSetting";
import getPopupClass from "../utils/getPopupClass";
import setLocalSetting from "../utils/setLocalSetting";
import vodiFn from "../utils/voidfn";
import Auth from "./Auth";
import CardHover from "./CardHover";
import ContentWrapper from "./ContentWrapper";
import DataStatus from "./DataStatus";
import ErrorBoundary from "./ErrorBoundary";
import LiveShareView from "./LiveShareView";
import LoadingBar from "./LoadingBar";
import PopupComponent from "./PopupComponent";
import Popups from "./Popups";
import Admin from "./popups/Admin";
import ArenaIdSelector from "./popups/ArenaIdSelector";
import DetailedLogs from "./popups/DetailedLogs";
import SettingsPersistor from "./SettingsPersistor";
import SharedDeckView from "./SharedDeckView";
import TopBar from "./TopBar";
import TopNav from "./TopNav";
import PublicProfilePage from "./views/profile/PublicProfilePage";
import ViewSettings from "./views/settings/ViewSettings";
import WhatsNewPopup from "./WhatsNewPopup";

export interface AppProps {
  forceOs?: string;
}

function App(props: AppProps) {
  const { forceOs } = props;
  const history = useHistory();
  const dispatch = useDispatch();
  const [canLogin, _setCanLogin] = useState(true);

  const {
    detailedLogs,
    adminPermissions,
    loginState,
    loading,
    backgroundGrpid,
    customBackground,
    matchInProgress,
    draftInProgress,
  } = useSelector((state: AppState) => state.renderer);

  const os = forceOs || (isElectron() ? process.platform : "");

  // Restore the saved background immediately on boot, before (and independent
  // of) login — so you see your background without waiting on the network. On
  // login, hydrateFromCloud + localLogin reconcile it with the account's choice.
  useEffect(() => {
    loadLocalBackground()
      .then((bg) => {
        if (bg) {
          reduxAction(dispatch, { type: "SET_CUSTOM_BACKGROUND", arg: bg });
        }
      })
      .catch(() => undefined);
  }, [dispatch]);

  // Overlays open and close on these flags — a draft overlay that only
  // re-evaluated on settings changes would never appear when a draft starts.
  useEffect(() => {
    if (overlayHandler) {
      overlayHandler.settingsUpdated();
    }
  }, [matchInProgress, draftInProgress]);

  useEffect(() => {
    // The public pages (/live/<token>, /share/deck/<token>, /profile/<id>)
    // must work with no account — never bounce them to /auth or run the
    // login flow for them.
    if (
      history.location.pathname.startsWith("/live/") ||
      history.location.pathname.startsWith("/share/") ||
      history.location.pathname.startsWith("/profile/")
    )
      return;
    if (canLogin) {
      const autoLogin = getLocalSetting("autoLogin");

      // "local" = offline mode (no account); "true" = cloud account, valid
      // only while a Supabase session is persisted.
      const checkSession =
        autoLogin === "local"
          ? Promise.resolve(true)
          : autoLogin === "true"
          ? getCloudSession().then((session) => !!session)
          : Promise.resolve(false);

      checkSession
        .then((ok) => {
          if (!ok) {
            history.push("/auth");
            return undefined;
          }
          // Claim the local store BEFORE hydrating: if it belongs to another
          // account it is wiped here, and doing that after the pull would delete
          // the data we just fetched. Without it, syncMatches below would upload
          // the previous account's history to this one.
          return getActiveUserId()
            .then(claimLocalStore)
            .then(() =>
              // Pull cloud data down first (no-op offline), then localLogin
              // mirrors the restored KV into Redux.
              hydrateFromCloud()
            )
            .then(() => localLogin())
            .then(() => {
              reduxAction(dispatch, {
                type: "SET_LOGIN_STATE",
                arg: LOGIN_OK,
              });

              // Connection status reflects the mtgatool cloud (Supabase) account:
              // "true" = signed in (online), "local" = offline mode.
              reduxAction(dispatch, {
                type: "SET_OFFLINE",
                arg: autoLogin !== "true",
              });

              // Start reading the Arena log on auto-login too (manual login in
              // Auth.tsx does this; without it, returning users never start the
              // watcher and nothing populates).
              if (electron) {
                postChannelMessage({ type: "START_LOG_READING" });
              }

              // Reconcile local match history with the cloud (no-op offline).
              syncMatches().catch(() => undefined);

              if (
                history.location.pathname === "" ||
                history.location.pathname === "/"
              ) {
                history.push("/auth");
              }
            });
        })
        .catch((e: Error) => {
          console.error(e);
          history.push("/auth");
        });
    }
  }, [canLogin, history, dispatch]);

  let wrapperClass = "app-wrapper-back";
  if (os == "linux") {
    if (loginState == LOGIN_OK) {
      wrapperClass = "app-wrapper-back-no-frame";
    }
  }

  const backgroundArt = useCardArtCrop(backgroundGrpid);

  const backgroundImage = customBackground
    ? `url(${customBackground.url})`
    : backgroundGrpid
    ? `url(${backgroundArt})`
    : undefined;

  const openSettings = useRef<() => void>(vodiFn);
  const closeSettings = useRef<() => void>(vodiFn);

  const openArenaIdSelector = useRef<() => void>(vodiFn);
  const closenArenaIdSelector = useRef<() => void>(vodiFn);

  const openDetailedLogs = useRef<() => void>(vodiFn);
  const closenDetailedLogs = useRef<() => void>(vodiFn);

  const openAdmin = useRef<() => void>(vodiFn);
  const closeAdmin = useRef<() => void>(vodiFn);

  const openWhatsNew = useRef<() => void>(vodiFn);
  const closeWhatsNew = useRef<() => void>(vodiFn);

  // Show the "What's new" modal once per version, on app open — before login,
  // so returning users see the new-account / no-carryover notice up front.
  useEffect(() => {
    // Not over the public pages. The live viewer is captured as an OBS
    // browser source, where a modal nobody can reach sits on the stream until
    // the scene is rebuilt; a shared-deck visitor may have no account at all.
    //
    // Returning before the flag is written, not after opening: marking the
    // version seen here would spend the notice on a window the person is
    // not looking at, and they would never be shown it in the app itself.
    if (
      history.location.pathname.startsWith("/live/") ||
      history.location.pathname.startsWith("/share/") ||
      history.location.pathname.startsWith("/profile/")
    )
      return;
    if (getLocalSetting("whatsNewSeen") !== info.version) {
      openWhatsNew.current();
      setLocalSetting("whatsNewSeen", info.version);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (detailedLogs === false) {
      openDetailedLogs.current();
    }
    if (detailedLogs === true) {
      closenDetailedLogs.current();
    }
  }, [detailedLogs]);

  useEffect(() => {
    if (adminPermissions === false) {
      openAdmin.current();
    }
    if (adminPermissions === true) {
      closeAdmin.current();
    }
  }, [adminPermissions]);

  return (
    <>
      <SettingsPersistor />
      <PopupComponent
        open={false}
        className={
          isElectron()
            ? os == "linux"
              ? "settings-popup-linux"
              : "settings-popup"
            : ""
        }
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
      <PopupComponent
        open={false}
        className={getPopupClass(os)}
        width="800px"
        height="600px"
        openFnRef={openDetailedLogs}
        closeFnRef={closenDetailedLogs}
        persistent={false}
      >
        <DetailedLogs onClose={closenDetailedLogs.current} />
      </PopupComponent>
      <PopupComponent
        open={false}
        className={getPopupClass(os)}
        width="640px"
        height="540px"
        openFnRef={openAdmin}
        closeFnRef={closeAdmin}
        persistent={false}
      >
        <Admin onClose={closeAdmin.current} />
      </PopupComponent>
      <PopupComponent
        open={false}
        className={getPopupClass(os)}
        width="640px"
        height="580px"
        openFnRef={openWhatsNew}
        closeFnRef={closeWhatsNew}
        persistent={false}
      >
        <WhatsNewPopup onClose={() => closeWhatsNew.current()} />
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
            <Route exact path="/auth" component={Auth} />
            {/* Public (no login): live overlay share viewer, see LiveShareView */}
            <Route exact path="/live/:id" component={LiveShareView} />
            {/* Public (no login): shared deck page, see SharedDeckView */}
            <Route exact path="/share/deck/:id" component={SharedDeckView} />
            {/* Player profiles work signed out too (anon-readable RPCs, like
                shared decks) — signed in they render inside the normal app
                shell, signed out in a standalone page. */}
            <Route path="/profile/:id">
              {loginState == LOGIN_OK ? (
                <>
                  <TopNav
                    openArenaIdSelector={openArenaIdSelector.current}
                    openSettings={openSettings.current}
                  />
                  <ContentWrapper forceOs={forceOs} />
                </>
              ) : (
                <PublicProfilePage />
              )}
            </Route>
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
          <div
            className="version-number"
            style={{ cursor: "pointer" }}
            title="What's new"
            onClick={() => openWhatsNew.current()}
          >
            v{info.version}
          </div>
        ) : (
          <></>
        )}
      </div>
    </>
  );
}

export default App;
