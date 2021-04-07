import { remote } from "electron";

export default function setTopMost(set: boolean) {
  if (set) remote.getCurrentWindow().setAlwaysOnTop(true, "floating");
  else {
    remote.getCurrentWindow().setAlwaysOnTop(false);
    remote.getCurrentWindow().focus();
  }
}
