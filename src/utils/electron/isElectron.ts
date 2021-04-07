// https://github.com/electron/electron/issues/2288
export default function isElectron() {
  const winProc: any = window.process;
  const procVer: any = process.versions;
  // Renderer process
  if (
    typeof window !== "undefined" &&
    typeof window.process === "object" &&
    winProc.type === "renderer"
  ) {
    return true;
  }

  // Main process
  if (
    typeof process !== "undefined" &&
    typeof process.versions === "object" &&
    !!procVer.electron
  ) {
    return true;
  }

  // Detect the user agent when the `nodeIntegration` option is set to true
  if (
    typeof navigator === "object" &&
    typeof navigator.userAgent === "string" &&
    navigator.userAgent.indexOf("Electron") >= 0
  ) {
    return true;
  }

  return false;
}
