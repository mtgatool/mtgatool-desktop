import { remote } from "electron";
import path from "path";

export default function getPublicPath(): string {
  const proc: any = process;

  return remote.app.isPackaged
    ? path.join(proc.resourcesPath)
    : path.join(remote.app.getAppPath(), "public");
}
