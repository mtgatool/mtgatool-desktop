import { remote } from "electron";

export default function hideWindow() {
  if (remote.getCurrentWindow().isVisible()) remote.getCurrentWindow().hide();
}
