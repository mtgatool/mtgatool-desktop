import { remote } from "electron";
import path from "path";
import url from "url";

export default function createOverlay(callback?: () => void): Promise<void> {
  const newWindow = new remote.BrowserWindow({
    transparent: true,
    resizable: true,
    fullscreen: false,
    title: "mtgatool-overlay",
    show: false,
    frame: false,
    width: 1024,
    height: 768,
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
    remote.app.isPackaged
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
        newWindow.webContents.openDevTools({ mode: "undocked" });
        newWindow.show();
        newWindow.focus();
      }, 1000);
    });

    newWindow.on("closed", () => {
      newWindow.destroy();
      if (callback) callback();
      resolve();
    });
  });
}
