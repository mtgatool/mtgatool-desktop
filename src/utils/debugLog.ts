import log from "electron-log";

type Levels = "error" | "warn" | "info" | "verbose" | "debug" | "silly";

export default function debugLog(data: any, level: Levels = "debug"): void {
  if (level == "error") log.error(data);
  if (level == "warn") log.warn(data);
  if (level == "info") log.info(data);
  if (level == "verbose") log.verbose(data);
  if (level == "debug") log.debug(data);
  if (level == "silly") log.silly(data);
}
