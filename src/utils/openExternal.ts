import isTauri from "./tauri/isTauri";

export default async function openExternal(url: string): Promise<void> {
  if (isTauri()) {
    try {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(url);
    } catch (e) {
      console.error("Failed to open external URL:", e);
      window.open(url);
    }
  } else {
    window.open(url);
  }
}
