import remote from "./remoteWrapper";

export default function setTopMost(set: boolean) {
  if (remote) {
    if (set) remote.getCurrentWindow().setAlwaysOnTop(true, "pop-up-menu", 1);
    else {
      remote.getCurrentWindow().setAlwaysOnTop(false);
      remote.getCurrentWindow().focus();
    }
  }
}
