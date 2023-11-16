import path from "path";

import electron from "./electronWrapper";
import remote from "./remoteWrapper";

export default function getPublicPath(): string {
  const proc: any = process;

  if (electron && remote) {
    return remote && remote.app.isPackaged
      ? path.join(proc.resourcesPath)
      : path.join(remote.app.getAppPath(), "public");
  }
  return __dirname;
}
