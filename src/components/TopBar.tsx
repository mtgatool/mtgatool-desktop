/* eslint-disable no-nested-ternary */
import { CSSProperties, useState } from "react";
import { constants } from "mtgatool-shared";

import { useSelector } from "react-redux";
import { ReactComponent as MacMinimize } from "../assets/images/svg/mac-minimize.svg";
import { ReactComponent as MacMaximize } from "../assets/images/svg/mac-maximize.svg";
import { ReactComponent as MacClose } from "../assets/images/svg/mac-close.svg";

import { ReactComponent as WinMinimize } from "../assets/images/svg/win-minimize.svg";
import { ReactComponent as WinMaximize } from "../assets/images/svg/win-maximize.svg";
import { ReactComponent as WinRestore } from "../assets/images/svg/win-restore.svg";
import { ReactComponent as WinClose } from "../assets/images/svg/win-close.svg";

import { ReactComponent as Logo } from "../assets/images/svg/logo.svg";

import minimizeWindow from "../utils/electron/minimizeWindow";
import setMaximize from "../utils/electron/setMaximize";
import hideWindow from "../utils/electron/hideWindow";
import isMaximized from "../utils/electron/isMaximized";
import { AppState } from "../redux/stores/rendererStore";

const { LOGIN_OK } = constants;

function clickMinimize(): void {
  minimizeWindow();
}

function clickMaximize(): void {
  setMaximize();
}

function clickClose(): void {
  // if (store.getState().settings.close_to_tray) {
  hideWindow();
  // } else {
  //  ipcSend("quit", 1);
  // }
}

export default function TopBar(): JSX.Element {
  const [hoverControls, setHoverControls] = useState(false);

  const { topArtist, offline, loginState } = useSelector(
    (state: AppState) => state.renderer
  );

  const os = process.platform;

  const topButtonClass = os == "darwin" ? "top-button-mac" : "top-button";

  const topButtonsContainerClass =
    os == "darwin" ? "top-buttons-container-mac" : "top-buttons-container";

  const isReverse = os == "darwin";

  const MinimizeSVG = os == "darwin" ? MacMinimize : WinMinimize;
  const MaximizeSVG = os == "darwin" ? MacMaximize : WinMaximize;
  const CloseSVG = os == "darwin" ? MacClose : WinClose;

  // Define components for simple ordering later
  const iconStyle: CSSProperties = {
    fill: os == "darwin" ? (hoverControls ? "#000000bf" : "#00000000") : "",
    margin: "auto",
  };

  const minimize = (
    <div
      onClick={clickMinimize}
      key="top-minimize"
      className={`${"minimize"} ${topButtonClass}`}
    >
      <MinimizeSVG style={iconStyle} />
    </div>
  );

  const maximize = (
    <div
      onClick={clickMaximize}
      key="top-maximize"
      className={`${"maximize"} ${topButtonClass}`}
    >
      {isMaximized() ? (
        <WinRestore style={iconStyle} />
      ) : (
        <MaximizeSVG style={iconStyle} />
      )}
    </div>
  );

  const close = (
    <div
      onClick={clickClose}
      key="top-close"
      className={`${"close"} ${topButtonClass}`}
    >
      <CloseSVG style={iconStyle} />
    </div>
  );

  const isOffline = <div className="unlink" title="You are not logged-in." />;

  return (
    <div
      className="top"
      style={{ flexDirection: isReverse ? "row-reverse" : "row" }}
    >
      <div
        style={{
          display: "flex",
          margin: isReverse ? "auto" : "",
          flexDirection: isReverse ? "row-reverse" : "row",
        }}
      >
        <Logo fill="#FFF" style={{ margin: "2px 8px", opacity: 0.6 }} />
        {loginState !== LOGIN_OK ? (
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
