import electron from "./electronWrapper";

export default function closeWindow() {
  if (electron) electron.remote.getCurrentWindow().close();
}
