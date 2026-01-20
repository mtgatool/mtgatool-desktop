declare global {
  interface Window {
    __TAURI__?: unknown;
  }
}

export default function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}
