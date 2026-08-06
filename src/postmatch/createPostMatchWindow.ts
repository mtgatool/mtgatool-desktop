import path from "path";
import url from "url";

import { Settings } from "../common/defaultConfig";
import { WINDOW_POSTMATCH } from "../types/app";
import remote from "../utils/electron/remoteWrapper";
import getLocalSetting from "../utils/getLocalSetting";

/**
 * The post-match overview window.
 *
 * Deliberately close to `createOverlay` — same transparency, same title
 * pinning, same dev-tools handling — with the differences that matter for a
 * window the user is meant to *use* rather than look past:
 *
 * - It stays focusable. The overlays call `setFocusable(false)` and
 *   `setAlwaysOnTop(…, "pop-up-menu")` so clicks fall through to the game;
 *   doing that here would leave the close button unclickable.
 * - It is centred and not always-on-top, because the match is over and there
 *   is nothing underneath left to watch.
 */
/**
 * Bring the window to the front, including over a fullscreen game.
 *
 * `moveTop` alone only wins against ordinary windows. A fullscreen app on
 * macOS owns its own Space, and a window that is not marked visible on all
 * workspaces simply lives on a different one — it never appears, however often
 * it is raised. This is the pair of calls the overlays already make, which is
 * why they show over a fullscreen game and this window did not.
 */
function raise(win: any): void {
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  // Above normal windows and above a fullscreen app's own level. Not
  // `setFocusable(false)` as the overlays add — this window has a close button
  // that has to be clickable.
  win.setAlwaysOnTop(true, "pop-up-menu", 1);
  win.moveTop();
}

export default function createPostMatchWindow(): void {
  if (!remote) return;

  const existing = remote.BrowserWindow.getAllWindows().find(
    (w: { getTitle: () => string }) => w.getTitle() === WINDOW_POSTMATCH
  );
  // A second match can finish before the last overview was dismissed; reuse the
  // window rather than stacking them. It reads the stashed match on mount, so
  // reloading is what refreshes it.
  if (existing) {
    existing.reload();
    existing.show();
    raise(existing);
    return;
  }

  const allSettings = JSON.parse(getLocalSetting("settings")) as Settings;

  const newWindow = new remote.BrowserWindow({
    transparent: allSettings.overlaysTransparency,
    backgroundColor: allSettings.overlaysTransparency ? undefined : "#0d0d0f",
    title: WINDOW_POSTMATCH,
    show: false,
    // Both governed by the overlay settings, because they answer the same
    // question for the same reason: a transparent, frameless window is
    // uninteractable on some Linux setups, and "Show overlay frame" is the
    // escape hatch users already know about.
    frame: allSettings.overlayFrame,
    // macOS draws a shadow around the *window*, not around what is painted in
    // it, so a transparent window gets a hard rounded outline tracing its
    // bounds — the panel then looks like it sits inside a frame it does not
    // have. The card carries its own CSS shadow instead.
    hasShadow: !allSettings.overlaysTransparency,
    center: true,
    width: 620,
    height: 800,
    resizable: true,
    // The layout adapts down to roughly half size; past this the bars stop
    // being readable at all, so the window refuses rather than degrading.
    minWidth: 320,
    minHeight: 380,
    // Set here as well as in `raise`, so the window is already at the right
    // level the moment it first paints rather than jumping a frame later.
    alwaysOnTop: true,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  newWindow.removeMenu();

  // Same trap as the overlays: the app HTML's <title> would overwrite the
  // window title this window is identified by, and electronIndex would then
  // render the main app in here instead of the overview.
  newWindow.on("page-title-updated", (e: { preventDefault: () => void }) => {
    e.preventDefault();
  });

  const proc: any = process;
  newWindow.loadURL(
    remote.app.isPackaged
      ? url.format({
          pathname: path.join(
            proc.resourcesPath,
            "app.asar",
            "build",
            "index.html"
          ),
          protocol: "file:",
          slashes: true,
        })
      : "http://localhost:3001"
  );

  remote.require("@electron/remote/main").enable(newWindow.webContents);

  newWindow.webContents.once("dom-ready", () => {
    newWindow.show();
    raise(newWindow);
  });
}
