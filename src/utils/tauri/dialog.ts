import isTauri from "./isTauri";

interface DialogFilter {
  name: string;
  extensions: string[];
}

interface OpenDialogResult {
  canceled: boolean;
  file_paths: string[];
}

export async function showOpenDialog(
  title?: string,
  defaultPath?: string,
  filters?: DialogFilter[]
): Promise<OpenDialogResult> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/tauri");
    return invoke<OpenDialogResult>("show_open_dialog", {
      title,
      defaultPath,
      filters,
    });
  }
  return { canceled: true, file_paths: [] };
}
