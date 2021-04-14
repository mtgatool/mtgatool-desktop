import { OverlaySettingsData } from "mtgatool-shared";
import path from "path";
import url from "url";
import electron from "../utils/electron/electronWrapper";
import getLocalSetting from "../utils/getLocalSetting";

export default function createOverlay(callback?: () => void): Promise<void> {
  if (!electron) return new Promise((a, r) => r());
  const settings = JSON.parse(
    getLocalSetting("overlay_0")
  ) as OverlaySettingsData;

  const newWindow = new electron.remote.BrowserWindow({
    transparent: true,
    // resizable: false,
    // skipTaskbar: true,
    focusable: false,
    title: "mtgatool-overlay",
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
      : "http://localhost:3000"
  );

  return new Promise<void>((resolve) => {
    newWindow.webContents.once("dom-ready", () => {
      // eslint-disable-next-line func-names
      setTimeout(function () {
        if (electron) {
          const overlayDevtools = new electron.remote.BrowserWindow({
            title: "MTG Arena Tool - overlay debug",
            icon: path.join(__dirname, "logo512.png"),
          });
          overlayDevtools.removeMenu();
          newWindow.webContents.setDevToolsWebContents(
            overlayDevtools.webContents
          );
          newWindow.webContents.openDevTools({ mode: "detach" });

          newWindow.setAlwaysOnTop(true, "floating");
          newWindow.setFocusable(false);
          newWindow.moveTop();
          newWindow.show();
        }
      }, 500);
    });

    newWindow.on("hide", () => {
      newWindow.destroy();
      if (callback) callback();
      resolve();
    });
  });
}
