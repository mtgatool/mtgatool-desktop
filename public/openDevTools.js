const path = require("path");
const { BrowserWindow } = require("electron");

const mainGlobals = require("./mainGlobals");

function openDevTools() {
  let closedDevtools = false;
  BrowserWindow.getAllWindows().forEach((w) => {
    const title = w.getTitle();
    if (title == "MTG Arena Tool - debug") {
      w.close();
      closedDevtools = true;
    }
    if (title == "MTG Arena Tool - background") {
      w.close();
      closedDevtools = true;
    }
    if (title == "MTG Arena Tool - hover") {
      w.close();
      closedDevtools = true;
    }
  });

  if (!closedDevtools) {
    const mainDevtools = new BrowserWindow({
      title: "MTG Arena Tool - debug",
      icon: path.join(__dirname, "logo512.png"),
    });
    mainDevtools.removeMenu();
    mainGlobals.mainWindow.webContents.setDevToolsWebContents(
      mainDevtools.webContents
    );
    mainGlobals.mainWindow.webContents.openDevTools({ mode: "detach" });

    const backDevtools = new BrowserWindow({
      title: "MTG Arena Tool - background",
      icon: path.join(__dirname, "logo512.png"),
    });
    backDevtools.removeMenu();
    mainGlobals.backgroundWindow.webContents.setDevToolsWebContents(
      backDevtools.webContents
    );
    mainGlobals.backgroundWindow.webContents.openDevTools({ mode: "detach" });

    const hoverDevTools = new BrowserWindow({
      title: "MTG Arena Tool - hover",
      icon: path.join(__dirname, "logo512.png"),
    });
    hoverDevTools.removeMenu();
    mainGlobals.cardHoverWindow.webContents.setDevToolsWebContents(
      hoverDevTools.webContents
    );
    mainGlobals.cardHoverWindow.webContents.openDevTools({ mode: "detach" });
  }
}

module.exports = openDevTools;
