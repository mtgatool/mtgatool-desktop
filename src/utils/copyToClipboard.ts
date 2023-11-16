import electron from "./electron/electronWrapper";

export default function copyToClipboard(str: string) {
  if (electron) {
    electron.clipboard.writeText(str);
  } else {
    navigator.clipboard.writeText(str);
  }
}
