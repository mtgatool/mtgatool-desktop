import { remote } from "electron";

export default function minimizeWindow() {
  remote.getCurrentWindow().minimize();
}
