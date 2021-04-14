import electron from "./electronWrapper";

export default function setResizable(set: boolean) {
  if (electron) electron.remote.getCurrentWindow().setResizable(set);
}
