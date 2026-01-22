// Main exports for Tauri utilities
export { default as isTauri } from "./isTauri";
export { default as getWindowLabel, getWindowLabelSync } from "./getWindowLabel";

// Window controls
export {
  closeWindow,
  minimizeWindow,
  hideWindow,
  showWindow,
  toggleMaximize,
  setMaximize,
  isMaximized,
  isFocused,
  setAlwaysOnTop,
  setResizable,
  setIgnoreCursorEvents,
  setFocusable,
} from "./windowControls";

// File system
export {
  readFile,
  writeFile,
  fileExists,
  getFileSize,
  createDir,
  deleteFile,
  getAppDataPath,
  getHomePath,
} from "./fileSystem";

// Shortcuts
export {
  registerShortcut,
  unregisterShortcut,
  unregisterAllShortcuts,
} from "./shortcuts";

// Dialog
export { showOpenDialog } from "./dialog";

// App
export { getPlatform, getDefaultLogPath, restartApp, quitApp } from "./app";

// Arena log watcher
export {
  startLogWatcher,
  stopLogWatcher,
  LogChunkPayload,
} from "./arenaLogWatcher";

// Overlay windows
export {
  createOverlayWindow,
  closeOverlayWindow,
  getAllOverlayWindows,
  getWindowBounds,
  setWindowBounds,
  OverlayBounds,
} from "./overlayWindow";

// Memory reader
export {
  isAdmin,
  findProcess,
  readData,
  readClass,
  readGenericInstance,
} from "./reader";
