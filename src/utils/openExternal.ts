import electron from "./electron/electronWrapper";

export default function openExternal(url: string) {
  if (electron) {
    electron.shell.openExternal(url);
  } else {
    window.open(url);
  }
}
