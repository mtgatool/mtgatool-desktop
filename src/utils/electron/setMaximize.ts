import remote from "./remoteWrapper";

export default function setMaximize(set?: boolean) {
  if (remote) {
    if (set == undefined) {
      if (remote.getCurrentWindow().isMaximized()) {
        remote.getCurrentWindow().unmaximize();
      } else {
        remote.getCurrentWindow().maximize();
      }
    } else if (!remote.getCurrentWindow().isMaximized() && !set) {
      remote.getCurrentWindow().unmaximize();
    } else if (set) {
      remote.getCurrentWindow().maximize();
    }
  }
}
