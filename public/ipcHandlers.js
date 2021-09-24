const { globalShortcut, ipcMain, dialog, app } = require("electron");
const mainGlobals = require("./mainGlobals");
const openDevTools = require("./openDevTools");

const ipc = ipcMain;

// [name]: webContents
const ipcWindows = {};

function handleIpcSwitch(_event, method, msg) {
  console.log(method, msg);
  if (msg.to) {
    const target = ipcWindows[msg.to];
    if (target) {
      target.send(method, msg.arg);
    }
  } else {
    switch (method) {
      // add more message handlers here
      case "popup":
        dialog.showMessageBox({ message: msg.arg });
        break;
      case "hide":
        if (mainGlobals.mainWindow.isVisible()) {
          mainGlobals.mainWindow.hide();
        }
        break;
      case "maximize":
        if (mainGlobals.mainWindow?.isMaximized()) {
          mainGlobals.mainWindow.restore();
        } else {
          mainGlobals.mainWindow?.maximize();
        }
        break;
      case "minimize":
        mainGlobals.mainWindow.minimize();
        break;
      case "setDevtoolsShortcut":
        globalShortcut.register(msg.arg || "Alt+Shift+D", openDevTools);
        break;
      case "quit":
        app.quit();
        break;
      default:
        break;
    }
  }
}

function handleIpcRegister(event, method) {
  console.log(`Register IPC`, method);
  ipcWindows[method] = event.sender;
}

function mainIpcInitialize() {
  ipc.on("ipc_switch", handleIpcSwitch);
  ipc.on("ipc_register", handleIpcRegister);
}

module.exports = mainIpcInitialize;
