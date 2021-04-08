import { remote } from "electron";
import path from "path";
import url from "url";

export default function createOverlay(callback?: () => void): Promise<void> {
  const newWindow = new remote.BrowserWindow({
    transparent: true,
    // resizable: false,
    // skipTaskbar: true,
    focusable: false,
    title: "mtgatool-overlay",
    show: false,
    frame: false,
    width: 1,
    height: 1,
    alwaysOnTop: true,
    acceptFirstMouse: true,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
    },
  });

  newWindow.removeMenu();
  newWindow.setVisibleOnAllWorkspaces(true);

  newWindow.setBounds({
    width: 370,
    height: 600,
    x: 16,
    y: 16,
  });

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
        const overlayDevtools = new remote.BrowserWindow({
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
      }, 500);
    });

    newWindow.on("hide", () => {
      newWindow.destroy();
      if (callback) callback();
      resolve();
    });
  });
}
