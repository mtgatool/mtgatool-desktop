import electron from "./electron/electronWrapper";

export default function copyToClipboard(str: string) {
  if (electron) {
    electron.remote.clipboard.writeText(str);
  } else {
    navigator.clipboard.writeText(str);
  }
}
