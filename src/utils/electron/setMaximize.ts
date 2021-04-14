import electron from "./electronWrapper";

export default function setMaximize(set?: boolean) {
  if (electron) {
    if (set == undefined) {
      if (electron.remote.getCurrentWindow().isMaximized()) {
        electron.remote.getCurrentWindow().unmaximize();
      } else {
        electron.remote.getCurrentWindow().maximize();
      }
    } else if (!electron.remote.getCurrentWindow().isMaximized() && !set) {
      electron.remote.getCurrentWindow().unmaximize();
    } else if (set) {
      electron.remote.getCurrentWindow().maximize();
    }
  }
}
