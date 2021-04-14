import electron from "./electronWrapper";

export default function setTopMost(set: boolean) {
  if (electron) {
    if (set)
      electron.remote.getCurrentWindow().setAlwaysOnTop(true, "floating");
    else {
      electron.remote.getCurrentWindow().setAlwaysOnTop(false);
      electron.remote.getCurrentWindow().focus();
    }
  }
}
