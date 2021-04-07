import { BrowserWindow, remote } from "electron";

export default function getBrowserWindowById(id: number): BrowserWindow | null {
  // eslint-disable-next-line global-require
  const windows = remote.BrowserWindow.getAllWindows().filter(
    (w) => w.id == id
  );
  if (windows.length > 0) return windows[0];
  return null;
}
