import remote from "./remoteWrapper";

export default function toggleMaximize() {
  if (remote) {
    if (remote.getCurrentWindow().isMaximized())
      remote.getCurrentWindow().unmaximize();
    else remote.getCurrentWindow().maximize();
  }
}
