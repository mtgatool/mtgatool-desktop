import path from "path";
import url from "url";

import { OverlaySettings, Settings } from "../common/defaultConfig";
import {
  WINDOW_OVERLAY_0,
  WINDOW_OVERLAY_1,
  WINDOW_OVERLAY_2,
  WINDOW_OVERLAY_3,
  WINDOW_OVERLAY_4,
} from "../types/app";
import electron from "../utils/electron/electronWrapper";
import getLocalSetting from "../utils/getLocalSetting";

const overlayIdToTitle = [
  WINDOW_OVERLAY_0,
  WINDOW_OVERLAY_1,
  WINDOW_OVERLAY_2,
  WINDOW_OVERLAY_3,
  WINDOW_OVERLAY_4,
];

export default function createOverlay(
  id: number,
  callback?: () => void
): Promise<void> {
  if (!electron) return new Promise((a, r) => r());

  const allSettings = JSON.parse(getLocalSetting("settings")) as Settings;
  const settings: OverlaySettings = allSettings.overlays[id];

  const newWindow = new electron.remote.BrowserWindow({
    transparent: allSettings.overlaysTransparency,
    // resizable: false,
    // skipTaskbar: true,
    focusable: !!allSettings.overlaysTransparency,
    backgroundColor: allSettings.overlaysTransparency ? undefined : "#0d0d0f",
    title: overlayIdToTitle[id],
    show: false,
    frame: false,
    width: settings.bounds.width,
    height: settings.bounds.height,
    x: settings.bounds.x,
    y: settings.bounds.y,
    alwaysOnTop: true,
    acceptFirstMouse: true,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  newWindow.removeMenu();
  newWindow.setVisibleOnAllWorkspaces(true);

  const proc: any = process;
  newWindow.loadURL(
    electron.remote.app.isPackaged
      ? url.format({
          pathname: path.join(
            proc.resourcesPath,
            "app.asar",
            "build",
            "index.html"
          ),
          protocol: "file:",
          slashes: true,
        })
      : "http://localhost:3001"
  );

  return new Promise<void>((resolve) => {
    newWindow.webContents.once("dom-ready", () => {
      // eslint-disable-next-line func-names
      if (electron && process.env.NODE_ENV === "development") {
        const overlayDevtools = new electron.remote.BrowserWindow({
          title: "MTG Arena Tool - overlay debug",
          icon: path.join(__dirname, "logo512.png"),
        });
        overlayDevtools.removeMenu();
        newWindow.webContents.setDevToolsWebContents(
          overlayDevtools.webContents
        );
        newWindow.webContents.openDevTools({ mode: "detach" });
      }

      setTimeout(() => {
        newWindow.show();
      }, 250);

      setTimeout(() => {
        newWindow.setFocusable(false);
        newWindow.setAlwaysOnTop(true, "pop-up-menu", 1);
      }, 500);
    });

    newWindow.on("close", () => {
      if (callback) callback();
      resolve();
    });
  });
}
