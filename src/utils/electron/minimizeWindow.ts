import electron from "./electronWrapper";

export default function minimizeWindow() {
  if (electron) electron.remote.getCurrentWindow().minimize();
}
