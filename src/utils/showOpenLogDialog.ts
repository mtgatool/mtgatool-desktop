import isTauri from "./tauri/isTauri";

export default async function showOpenLogDialog(
  defaultPath: string
): Promise<{ filePaths: string[] } | null> {
  if (!isTauri()) {
    return null;
  }

  try {
    const { open } = await import("@tauri-apps/api/dialog");

    const selected = await open({
      title: "Arena Log Location",
      defaultPath,
      filters: [
        { name: "Log Files", extensions: ["log"] },
        { name: "Text", extensions: ["txt", "text"] },
        { name: "All Files", extensions: ["*"] },
      ],
      multiple: false,
      directory: false,
    });

    if (selected && typeof selected === "string") {
      return { filePaths: [selected] };
    }

    return null;
  } catch (e) {
    console.error("Failed to show open dialog:", e);
    return null;
  }
}
