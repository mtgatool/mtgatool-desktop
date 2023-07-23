// eslint-disable-next-line import/no-unresolved
const { app, net, BrowserWindow, protocol, Menu, Tray } = require("electron");
const path = require("path");
const url = require("url");

const { autoUpdater } = require("electron-updater");

// const DC = require("discovery-channel");
const mainIpcInitialize = require("./ipcHandlers");
const mainGlobals = require("./mainGlobals");
const installDevTools = require("./devtools");

const iconNormal = "icon.png";
const iconTrayOsx = "icon-tray-osx.png";
const iconTray8x = "icon-tray@8x.png";
const icon256 = "icon-256.png";

let tray = null;

app.disableHardwareAcceleration();
app.setAppUserModelId("com.mtgatool.desktop");
app.allowRendererProcessReuse = false;

function quit() {
  app.quit();
  app.exit();
}

const singleLock = app.requestSingleInstanceLock();

if (!singleLock) {
  console.log("We dont have single instance lock! quitting the app.");
  quit();
}

function sendInit() {
  console.log("Renderer Init signal");
  mainGlobals.backgroundWindow.webContents.send("rendererInit", true);

  let body = "";
  const request = net.request({
    method: "GET",
    protocol: "https:",
    hostname: "api.github.com",
    port: 443,
    path: "repos/frcaton/mtga-tracker-daemon/releases/latest",
  });
  request.on("response", (response) => {
    response.on("data", (chunk) => {
      body += chunk.toString();
    });

    response.on("end", () => {
      mainGlobals.mainWindow.webContents.send(
        "mtgaTrackerDaemonVersion",
        JSON.parse(body)
      );
    });
  });
  request.on("error", console.log);
  request.end();

  /*
  // This was okay, but instead we use webrtc to find servers, and then
  // connect to them on the client side
  const peers = [];
  const channel = DC();
  channel.join("mtgatool-db-swarm-v4");
  channel.on("peer", (id, peer) => {
    console.log("Server peer found: ", peer);
    if (
      !peers
        .map((p) => `${p.host}:${p.port}`)
        .includes(`${peer.host}:${peer.port}`)
    ) {
      peers.push(peer);
      mainGlobals.backgroundWindow.webContents.send("peersFound", peers);
    }
  });
  */
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
  console.log(">> createWindow()");

  if (
    mainGlobals.backgroundWindow !== null ||
    mainGlobals.mainWindow !== null
  ) {
    console.log("Already initialized? not doing it again");
    return;
  }

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

  let iconPath = iconTrayOsx;
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
    mainGlobals.mainWindow.hide();
  });

  mainGlobals.mainWindow.webContents.once("dom-ready", () => {
    mainGlobals.mainWindow.show();
    mainGlobals.mainWindow.focus();
    sendInit();

    if (mainGlobals.updaterWindow) {
      console.log("destroy updater");
      mainGlobals.updaterWindow.destroy();
      mainGlobals.updaterWindow = null;
    }
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

  win.on("close", (e) => {
    win.hide();
    e.preventDefault();
  });

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
  // app.on("before-quit", () => {
  //   quit();
  // });

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
  createWindow();
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
  createWindow();
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

app.on("second-instance", () => {
  if (mainGlobals.updaterWindow) {
    showWindow();
  } else if (mainGlobals.mainWindow?.isVisible()) {
    if (mainGlobals.mainWindow.isMinimized()) {
      showWindow();
    }
  } else {
    showWindow();
  }
});
