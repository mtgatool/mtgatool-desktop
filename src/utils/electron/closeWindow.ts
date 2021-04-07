import { remote } from "electron";

export default function closeWindow() {
  remote.getCurrentWindow().close();
}
