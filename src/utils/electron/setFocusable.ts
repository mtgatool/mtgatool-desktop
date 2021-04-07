import { remote } from "electron";

export default function setFocusable(set: boolean) {
  remote.getCurrentWindow().setFocusable(set);
  if (set) {
    remote.getCurrentWindow().focus();
  }
}
