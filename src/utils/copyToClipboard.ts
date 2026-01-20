import isTauri from "./tauri/isTauri";

export default async function copyToClipboard(str: string): Promise<void> {
  if (isTauri()) {
    try {
      const { writeText } = await import("@tauri-apps/api/clipboard");
      await writeText(str);
    } catch (e) {
      console.error("Failed to copy to clipboard:", e);
      navigator.clipboard.writeText(str);
    }
  } else {
    navigator.clipboard.writeText(str);
  }
}
