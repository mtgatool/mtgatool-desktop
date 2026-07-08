// Main exports for Tauri utilities
export {
  default as getWindowLabel,
  getWindowLabelSync,
} from "./getWindowLabel";
export { default as isTauri } from "./isTauri";

// Window controls
export {
  closeWindow,
  hideWindow,
  isFocused,
  isMaximized,
  minimizeWindow,
  setAlwaysOnTop,
  setFocusable,
  setIgnoreCursorEvents,
  setMaximize,
  setResizable,
  showWindow,
  toggleMaximize,
} from "./windowControls";

// File system
export {
  createDir,
  deleteFile,
  fileExists,
  getAppDataPath,
  getFileSize,
  getHomePath,
  readFile,
  writeFile,
} from "./fileSystem";

// Shortcuts
export {
  registerShortcut,
  unregisterAllShortcuts,
  unregisterShortcut,
} from "./shortcuts";

// Dialog
export { showOpenDialog } from "./dialog";

// App
export { getDefaultLogPath, getPlatform, quitApp, restartApp } from "./app";

// Arena log watcher
export type { LogChunkPayload } from "./arenaLogWatcher";
export { startLogWatcher, stopLogWatcher } from "./arenaLogWatcher";

// Overlay windows
export type { OverlayBounds } from "./overlayWindow";
export {
  closeOverlayWindow,
  createOverlayWindow,
  getAllOverlayWindows,
  getWindowBounds,
  setWindowBounds,
} from "./overlayWindow";

// Memory reader
export {
  findProcess,
  isAdmin,
  readAccount,
  readClass,
  readCollection,
  readData,
  readDecks,
  readerClose,
  readerInit,
  readerIsInitialized,
  readGenericInstance,
  readInventory,
  readRanks,
} from "./reader";
