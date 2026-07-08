export default function isTauri(): boolean {
  // Tauri v2 always injects __TAURI_INTERNALS__ into the webview; __TAURI__ is
  // only present when `withGlobalTauri` is enabled (which we also turn on), so
  // check both to be safe.
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}
