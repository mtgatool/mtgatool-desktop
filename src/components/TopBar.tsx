/* eslint-disable no-nested-ternary */
import { BrowserWindow } from "electron";
import { COLORS_ALL } from "mtgatool-shared/dist/shared/constants";
import { CSSProperties, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { ReactComponent as Logo } from "../assets/images/svg/logo.svg";
import { ReactComponent as MacClose } from "../assets/images/svg/mac-close.svg";
import { ReactComponent as MacMaximize } from "../assets/images/svg/mac-maximize.svg";
import { ReactComponent as MacMinimize } from "../assets/images/svg/mac-minimize.svg";
import { ReactComponent as WinClose } from "../assets/images/svg/win-close.svg";
import { ReactComponent as WinMaximize } from "../assets/images/svg/win-maximize.svg";
import { ReactComponent as WinMinimize } from "../assets/images/svg/win-minimize.svg";
import { ReactComponent as WinRestore } from "../assets/images/svg/win-restore.svg";
import { overlayTitleToId } from "../common/maps";
import store, { AppState } from "../redux/stores/rendererStore";
import { ALL_OVERLAYS, WINDOW_MAIN } from "../types/app";
import getWindowTitle from "../utils/electron/getWindowTitle";
import hideWindow from "../utils/electron/hideWindow";
import isFocused from "../utils/electron/isFocused";
import isMaximized from "../utils/electron/isMaximized";
import minimizeWindow from "../utils/electron/minimizeWindow";
import remote from "../utils/electron/remoteWrapper";
import setMaximize from "../utils/electron/setMaximize";

function clickMinimize(): void {
  minimizeWindow();
}

function clickMaximize(): void {
  setMaximize();
}

function clickClose(): void {
  if (store.getState().settings.closeToTray) {
    hideWindow();
  } else {
    // ipcSend("quit", 1);
  }
}

function clickCloseOverlay(): void {
  if (remote) {
    const thisWindowTitle = remote.getCurrentWindow().getTitle();
    // const overlayId = overlayTitleToId[thisWindowTitle];
    // reduxAction(store.dispatch, {
    //   type: "SET_OVERLAY_SETTINGS",
    //   arg: {
    //     id: overlayId,
    //     settings: {
    //       show: false,
    //     },
    //   },
    // });
    remote.BrowserWindow.getAllWindows().forEach((w: BrowserWindow) => {
      if (w.getTitle() == thisWindowTitle) {
        w.close();
        w.destroy();
      }
    });
  }
}

interface TopBarProps {
  forceOs?: string;
  closeCallback?: () => void;
}

export default function TopBar(props: TopBarProps): JSX.Element {
  const { forceOs, closeCallback } = props;
  const [hoverControls, setHoverControls] = useState(false);

  const offline = useSelector((state: AppState) => state.renderer.offline);
  const topArtist = useSelector((state: AppState) => state.renderer.topArtist);

  const os = forceOs || process.platform;

  const isOverlay = ALL_OVERLAYS.includes(getWindowTitle());

  const [_redraw, setRedraw] = useState(0);

  useEffect(() => {
    if (os !== "darwin") {
      return () => {
        //
      };
    }

    const interval = setInterval(() => {
      setRedraw(new Date().getTime());
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const topButtonClass =
    os == "darwin"
      ? isFocused()
        ? "top-button-mac"
        : "top-button-mac-unfocus"
      : "top-button";

  const topButtonsContainerClass =
    os == "darwin" ? "top-buttons-container-mac" : "top-buttons-container";

  const isReverse = os == "darwin";

  const MinimizeSVG = os == "darwin" ? MacMinimize : WinMinimize;
  const MaximizeSVG = os == "darwin" ? MacMaximize : WinMaximize;
  const RestoreSVG = os == "darwin" ? MacMaximize : WinRestore;
  const CloseSVG = os == "darwin" ? MacClose : WinClose;

  // Define components for simple ordering later
  const iconStyle: CSSProperties = {
    fill: os == "darwin" ? (hoverControls ? "#0000008c" : "#00000000") : "",
    margin: "auto",
  };

  const minimize = isOverlay ? (
    <></>
  ) : (
    <div
      onClick={clickMinimize}
      key="top-minimize"
      className={`minimize ${topButtonClass}`}
    >
      <MinimizeSVG style={iconStyle} />
    </div>
  );

  const maximize = isOverlay ? (
    <></>
  ) : (
    <div
      onClick={clickMaximize}
      key="top-maximize"
      className={`maximize ${topButtonClass}`}
    >
      {isMaximized() ? (
        <RestoreSVG style={iconStyle} />
      ) : (
        <MaximizeSVG style={iconStyle} />
      )}
    </div>
  );

  const close = (
    <div
      onClick={closeCallback || (isOverlay ? clickCloseOverlay : clickClose)}
      key="top-close"
      className={`close ${topButtonClass}`}
    >
      <CloseSVG style={iconStyle} />
    </div>
  );

  const isOffline = <div className="unlink" title="You are not logged-in." />;

  return (
    <div
      className="top click-on"
      style={{ flexDirection: isReverse ? "row-reverse" : "row" }}
    >
      {isOverlay && (
        <div
          className="overlay-icon"
          style={{
            backgroundColor: `var(--color-${
              COLORS_ALL[overlayTitleToId[getWindowTitle()]]
            })`,
          }}
        />
      )}
      <div
        style={{
          display: "flex",
          margin: isReverse ? "auto" : "",
          flexDirection: isReverse ? "row-reverse" : "row",
        }}
      >
        <Logo fill="#FFF" style={{ margin: "2px 8px", opacity: 0.6 }} />
        {getWindowTitle() == WINDOW_MAIN ? (
          <div className="top-artist">{topArtist}</div>
        ) : (
          <></>
        )}
        {offline && isReverse && isOffline}
      </div>
      <div
        onMouseEnter={(): void => setHoverControls(true)}
        onMouseLeave={(): void => setHoverControls(false)}
        className={topButtonsContainerClass}
      >
        {offline && !isReverse && isOffline}
        {os == "darwin"
          ? [close, minimize, maximize]
          : [minimize, maximize, close]}
      </div>
    </div>
  );
}
