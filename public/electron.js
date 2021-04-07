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
const mainIpcInitialize = require("./ipcHandlers");
const openDevTools = require("./openDevTools");
const mainGlobals = require("./mainGlobals");
const installDevTools = require("./devtools");

let tray = null;

app.allowRendererProcessReuse = false;

function sendInit() {
  console.log("Renderer Init signal");
  mainGlobals.mainWindow.webContents.send("rendererInit", true);
}

function showWindow() {
  if (mainGlobals.mainWindow) {
    if (
      !mainGlobals.mainWindow.isVisible() ||
      mainGlobals.mainWindow.isMinimized()
    )
      mainGlobals.mainWindow.show();
    else mainGlobals.mainWindow.moveTop();
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

function createWindow() {
  mainGlobals.backgroundWindow = new BrowserWindow({
    show: false,
    resizable: true,
    width: 600,
    height: 400,
    title: "mtgatool-background",
    webPreferences: {
      nodeIntegration: true,
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
    title: "MTG Arena Tool",
    acceptFirstMouse: true,
    webPreferences: {
      // webSecurity: false,
      // nodeIntegrationInWorker: true,
      nodeIntegration: true,
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
  globalShortcut.register("Alt+Shift+D", openDevTools);

  const iconPath = "icon-256.png";

  tray = new Tray(path.join(__dirname, "icons", iconPath));
  tray.on("double-click", toggleWindow);
  tray.setToolTip("Super Reality");
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

function preCreateWindow() {
  setTimeout(createWindow, 1000);
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
