import electron from "./electronWrapper";
import isElectron from "./isElectron";

export default function restartApp() {
  if (isElectron() && electron) {
    electron.remote.app.relaunch();
    electron.remote.app.quit();
  }
}
