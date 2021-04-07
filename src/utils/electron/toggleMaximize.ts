import { remote } from "electron";

export default function toggleMaximize() {
  if (remote.getCurrentWindow().isMaximized())
    remote.getCurrentWindow().unmaximize();
  else remote.getCurrentWindow().maximize();
}
