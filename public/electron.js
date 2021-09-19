// eslint-disable-next-line import/no-unresolved
const {
  app,
  globalShortcut,
  BrowserWindow,
  protocol,
  Menu,
  Tray,
} = require("electron");
const path = require("path");
const url = require("url");

const { autoUpdater } = require("electron-updater");

const mainIpcInitialize = require("./ipcHandlers");
const openDevTools = require("./openDevTools");
const mainGlobals = require("./mainGlobals");
const installDevTools = require("./devtools");

const iconNormal = "icon.png";
const iconTray = "icon-tray.png";
const iconTray8x = "icon-tray@8x.png";
const icon256 = "icon-256.png";

let tray = null;

app.allowRendererProcessReuse = false;

function sendInit() {
  console.log("Renderer Init signal");
  mainGlobals.backgroundWindow.webContents.send("rendererInit", true);
}

function showDock() {
  if (process.platform == "darwin" && !app.dock.isVisible()) {
    app.dock.show().then(() => {
      app.dock.setIcon(path.join(__dirname, "icons", icon256));
    });
  }
}

function showWindow() {
  if (mainGlobals.mainWindow) {
    if (
      !mainGlobals.mainWindow.isVisible() ||
      mainGlobals.mainWindow.isMinimized()
    )
      mainGlobals.mainWindow.show();
    else mainGlobals.mainWindow.moveTop();

    showDock();
  }
}

function toggleWindow() {
  if (mainGlobals.mainWindow && mainGlobals.mainWindow.isVisible()) {
    if (!mainGlobals.mainWindow.isMinimized()) {
      mainGlobals.mainWindow.minimize();
    } else {
      showWindow();
    }
  } else {
    showWindow();
  }
}

function quit() {
  app.quit();
  app.exit();
}

function createCardHoverWindow() {
  mainGlobals.cardHoverWindow = new BrowserWindow({
    transparent: true,
    focusable: false,
    title: "mtgatool-hover",
    show: false,
    frame: false,
    width: 400,
    height: 600,
    x: 0,
    y: 0,
    alwaysOnTop: true,
    acceptFirstMouse: true,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainGlobals.cardHoverWindow.removeMenu();
  mainGlobals.cardHoverWindow.loadURL(
    process.env.ELECTRON_START_URL ||
      url.format({
        pathname: path.join(__dirname, "..", "build", "index.html"),
        protocol: "file:",
        slashes: true,
      })
  );

  mainGlobals.cardHoverWindow.once("dom-ready", () => {
    // eslint-disable-next-line func-names
    setTimeout(function () {
      mainGlobals.cardHoverWindow.setAlwaysOnTop(true, "pop-up-menu");
      mainGlobals.cardHoverWindow.setFocusable(false);
      mainGlobals.cardHoverWindow.moveTop();
      mainGlobals.cardHoverWindow.show();
    }, 500);
  });
}

function createWindow() {
  if (mainGlobals.backgroundWindow !== null || mainGlobals.mainWindow !== null)
    return;

  mainGlobals.backgroundWindow = new BrowserWindow({
    show: false,
    resizable: true,
    width: 600,
    height: 400,
    icon: path.join(__dirname, "icons", iconNormal),
    title: "mtgatool-background",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainGlobals.backgroundWindow.loadURL(
    process.env.ELECTRON_START_URL ||
      url.format({
        pathname: path.join(__dirname, "..", "build", "index.html"),
        protocol: "file:",
        slashes: true,
      })
  );

  mainGlobals.backgroundWindow.on("closed", () => {
    quit();
  });

  mainGlobals.mainWindow = new BrowserWindow({
    backgroundColor: "#000",
    frame: process.platform == "linux",
    alwaysOnTop: false,
    transparent: false,
    resizable: true,
    fullscreen: false,
    show: false,
    width: 1000,
    height: 700,
    icon: path.join(__dirname, "icons", iconNormal),
    title: "MTG Arena Tool",
    acceptFirstMouse: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainGlobals.mainWindow.loadURL(
    process.env.ELECTRON_START_URL ||
      url.format({
        pathname: path.join(__dirname, "..", "build", "index.html"),
        protocol: "file:",
        slashes: true,
      })
  );

  mainGlobals.mainWindow.removeMenu();

  createCardHoverWindow();

  globalShortcut.register("Alt+Shift+D", openDevTools);

  let iconPath = iconTray;
  if (process.platform == "linux") {
    iconPath = iconTray8x;
  }
  if (process.platform == "win32") {
    iconPath = icon256;
  }

  tray = new Tray(path.join(__dirname, "icons", iconPath));
  tray.on("double-click", toggleWindow);
  tray.setToolTip("MTG Arena Tool");
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show",
      click: () => {
        showWindow();
      },
    },
    {
      label: "Quit",
      click: () => {
        console.log("Bye bye!");
        quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);

  mainGlobals.mainWindow.on("closed", () => {
    quit();
  });

  mainGlobals.mainWindow.on("close", (e) => {
    e.preventDefault();
    quit();
  });

  mainGlobals.mainWindow.webContents.once("dom-ready", () => {
    mainGlobals.mainWindow.show();
    mainGlobals.mainWindow.focus();
    sendInit();
  });

  mainIpcInitialize();
  if (!app.isPackaged) {
    installDevTools();
  }
}

function createUpdaterWindow() {
  const win = new BrowserWindow({
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    center: true,
    show: false,
    width: 320,
    height: 240,
    title: "mtgatool-updater",
    icon: path.join(__dirname, "icons", iconNormal),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  win.setIcon(path.join(__dirname, "icons", iconNormal));
  win.loadURL(
    process.env.ELECTRON_START_URL ||
      url.format({
        pathname: path.join(__dirname, "..", "build", "index.html"),
        protocol: "file:",
        slashes: true,
      })
  );

  return win;
}

function startUpdater() {
  if (!app.isPackaged) return;

  mainGlobals.updaterWindow = createUpdaterWindow();

  mainGlobals.updaterWindow.webContents.on("did-finish-load", () => {
    mainGlobals.updaterWindow.show();
    mainGlobals.updaterWindow.moveTop();
  });

  // autoUpdater.allowDowngrade = true;
  // autoUpdater.allowPrerelease = allowBeta;
  autoUpdater.checkForUpdatesAndNotify();
}

function installUpdate() {
  autoUpdater.quitAndInstall(true, true);
}

autoUpdater.on("update-not-available", (info) => {
  console.log("Update not available");
  console.log(info);
  if (mainGlobals.mainWindow) {
    mainGlobals.mainWindow.webContents.send(
      "set_update_state",
      "Client up to date!"
    );
  }
  setTimeout(createWindow, 100);
});

autoUpdater.on("error", (err) => {
  if (mainGlobals.mainWindow) {
    mainGlobals.mainWindow.webContents.send(
      "set_update_state",
      "Update error."
    );
  }
  console.log("Update error: ");
  console.log(err, "error");
  setTimeout(createWindow, 100);
});

autoUpdater.on("download-progress", (progressObj) => {
  mainGlobals.updaterWindow?.webContents.send("update_progress", progressObj);
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("Update downloaded:");
  console.log(info);
  installUpdate();
});

function preCreateWindow() {
  if (app.isPackaged) {
    startUpdater();
  } else {
    setTimeout(createWindow, 100);
  }
}

app.whenReady().then(() => {
  protocol.registerFileProtocol("file", (request, callback) => {
    const pathname = decodeURI(request.url.replace("file:///", ""));
    callback(pathname);
  });
});

app.on("ready", preCreateWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    quit();
  }
});

app.on("activate", () => {
  if (mainGlobals.mainWindow === null) {
    preCreateWindow();
  }
});
