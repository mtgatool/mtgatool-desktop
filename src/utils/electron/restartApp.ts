import isElectron from "./isElectron";
import remote from "./remoteWrapper";

export default function restartApp() {
  if (isElectron() && remote) {
    remote.app.relaunch();
    remote.app.quit();
  }
}
