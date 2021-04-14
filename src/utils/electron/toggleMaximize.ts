import electron from "./electronWrapper";

export default function toggleMaximize() {
  if (electron) {
    if (electron.remote.getCurrentWindow().isMaximized())
      electron.remote.getCurrentWindow().unmaximize();
    else electron.remote.getCurrentWindow().maximize();
  }
}
