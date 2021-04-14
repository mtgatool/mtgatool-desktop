import electron from "./electronWrapper";

export default function setFocusable(set: boolean) {
  if (electron) {
    electron.remote.getCurrentWindow().setFocusable(set);
    if (set) {
      electron.remote.getCurrentWindow().focus();
    }
  }
}
