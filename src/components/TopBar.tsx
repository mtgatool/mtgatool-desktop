/* eslint-disable no-nested-ternary */
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
import { COLORS_ALL } from "../constants";
import store, { AppState } from "../redux/stores/rendererStore";
import {
  ALL_TAURI_OVERLAY_LABELS,
  getOverlayIndexFromLabel,
  WINDOW_MAIN,
} from "../types/app";
import isTauri from "../utils/tauri/isTauri";

// Get current window label in Tauri (from the reliable per-window metadata;
// the old window.__TAURI__.window.appWindow path returned "main" for every
// window in this build).
function getWindowLabel(): string {
  if (isTauri()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (window as any).__TAURI_METADATA__;
    return meta?.__currentWindow?.label || "main";
  }
  return "main";
}

// Check if current window is an overlay
function isOverlayWindow(): boolean {
  const label = getWindowLabel();
  return ALL_TAURI_OVERLAY_LABELS.includes(label);
}

// Get overlay index from current window
function getCurrentOverlayIndex(): number {
  return getOverlayIndexFromLabel(getWindowLabel());
}

// Tauri window control functions
async function minimizeWindow(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { appWindow } = await import("@tauri-apps/api/window");
    await appWindow.minimize();
  } catch (e) {
    console.error("Failed to minimize window:", e);
  }
}

async function toggleMaximize(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { appWindow } = await import("@tauri-apps/api/window");
    await appWindow.toggleMaximize();
  } catch (e) {
    console.error("Failed to toggle maximize:", e);
  }
}

async function hideWindow(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { appWindow } = await import("@tauri-apps/api/window");
    await appWindow.hide();
  } catch (e) {
    console.error("Failed to hide window:", e);
  }
}

async function closeOverlayWindow(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { appWindow } = await import("@tauri-apps/api/window");
    await appWindow.close();
  } catch (e) {
    console.error("Failed to close window:", e);
  }
}

async function checkIsMaximized(): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    const { appWindow } = await import("@tauri-apps/api/window");
    return await appWindow.isMaximized();
  } catch {
    return false;
  }
}

async function checkIsFocused(): Promise<boolean> {
  if (!isTauri()) return true;
  try {
    const { appWindow } = await import("@tauri-apps/api/window");
    return await appWindow.isFocused();
  } catch {
    return true;
  }
}

async function getPlatform(): Promise<string> {
  if (!isTauri()) return "win32";
  try {
    const { platform } = await import("@tauri-apps/api/os");
    return await platform();
  } catch {
    return "win32";
  }
}

function clickMinimize(): void {
  minimizeWindow();
}

function clickMaximize(): void {
  toggleMaximize();
}

function clickClose(): void {
  if (store.getState().settings.closeToTray) {
    hideWindow();
  } else {
    // For now, just hide - quit handled elsewhere
    hideWindow();
  }
}

function clickCloseOverlay(): void {
  closeOverlayWindow();
}

interface TopBarProps {
  forceOs?: string;
  closeCallback?: () => void;
}

export default function TopBar(props: TopBarProps): JSX.Element {
  const { forceOs, closeCallback } = props;
  const [hoverControls, setHoverControls] = useState(false);
  const [os, setOs] = useState<string>(forceOs || "win32");
  const [maximized, setMaximized] = useState(false);
  const [focused, setFocused] = useState(true);

  const topArtist = useSelector((state: AppState) => state.renderer.topArtist);

  const isOverlay = isOverlayWindow();
  const windowLabel = getWindowLabel();

  const [_redraw, setRedraw] = useState(0);

  // Get platform on mount
  useEffect(() => {
    if (!forceOs) {
      getPlatform().then(setOs);
    }
  }, [forceOs]);

  // Update maximized/focused state periodically for macOS style
  useEffect(() => {
    if (os !== "darwin") {
      return () => {
        //
      };
    }

    const updateState = async () => {
      const [max, foc] = await Promise.all([
        checkIsMaximized(),
        checkIsFocused(),
      ]);
      setMaximized(max);
      setFocused(foc);
      setRedraw(new Date().getTime());
    };

    const interval = setInterval(updateState, 50);
    updateState();

    return () => {
      clearInterval(interval);
    };
  }, [os]);

  // Update maximized state for Windows
  useEffect(() => {
    if (os === "darwin") {
      return () => {
        //
      };
    }

    const updateMaximized = async () => {
      const max = await checkIsMaximized();
      setMaximized(max);
    };

    const interval = setInterval(updateMaximized, 200);
    updateMaximized();

    return () => {
      clearInterval(interval);
    };
  }, [os]);

  const topButtonClass =
    os == "darwin"
      ? focused
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
      {maximized ? (
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

  return (
    <div
      className="top click-on"
      style={{ flexDirection: isReverse ? "row-reverse" : "row" }}
      // Tauri drags the window from elements marked with this attribute
      // (Tauri ignores Electron's -webkit-app-region CSS).
      data-tauri-drag-region
    >
      {isOverlay && (
        <div
          className="overlay-icon"
          style={{
            backgroundColor: `var(--color-${
              COLORS_ALL[getCurrentOverlayIndex()]
            })`,
          }}
        />
      )}
      <div
        data-tauri-drag-region
        style={{
          display: "flex",
          margin: isReverse ? "auto" : "",
          flexDirection: isReverse ? "row-reverse" : "row",
        }}
      >
        <Logo fill="#FFF" style={{ margin: "2px 8px", opacity: 0.6 }} />
        {windowLabel === WINDOW_MAIN ? (
          <div className="top-artist">{topArtist}</div>
        ) : (
          <></>
        )}
      </div>
      <div
        onMouseEnter={(): void => setHoverControls(true)}
        onMouseLeave={(): void => setHoverControls(false)}
        className={topButtonsContainerClass}
      >
        {os == "darwin"
          ? [close, minimize, maximize]
          : [minimize, maximize, close]}
      </div>
    </div>
  );
}
