import electron from "./electronWrapper";

export default function getPrimaryMonitor() {
  if (electron) return electron.remote.screen.getPrimaryDisplay();
  return undefined;
}
