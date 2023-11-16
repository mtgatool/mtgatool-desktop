import remote from "./remoteWrapper";

export default function getPrimaryMonitor() {
  if (remote) return remote.screen.getPrimaryDisplay();
  return undefined;
}
