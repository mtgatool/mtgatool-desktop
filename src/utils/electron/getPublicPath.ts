import path from "path";

import electron from "./electronWrapper";

export default function getPublicPath(): string {
  const proc: any = process;

  if (electron) {
    return electron.remote.app.isPackaged
      ? path.join(proc.resourcesPath)
      : path.join(electron.remote.app.getAppPath(), "public");
  }
  return __dirname;
}
