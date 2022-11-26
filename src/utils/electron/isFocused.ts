import electron from "./electronWrapper";

export default function isFocused() {
  if (electron) {
    return electron.remote.getCurrentWindow().isFocused();
  }
  return false;
}
