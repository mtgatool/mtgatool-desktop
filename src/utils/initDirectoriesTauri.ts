import { createDir, fileExists, getAppDataPath } from "./tauri/fileSystem";

export default async function initDirectoriesTauri(): Promise<void> {
  try {
    const appDataPath = await getAppDataPath();
    const actionLogDir = `${appDataPath}/actionlogs`;

    const exists = await fileExists(actionLogDir);
    if (!exists) {
      await createDir(actionLogDir);
    }
  } catch (e) {
    console.warn("Failed to initialize directories:", e);
  }
}
