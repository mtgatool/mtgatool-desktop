import electron from "./electron/electronWrapper";

export default function defaultLogUri(): string {
  if (!electron) return "";

  if (process.platform == "darwin") {
    return `${electron.remote.app.getPath(
      "home"
    )}/Library/Logs/Wizards Of The Coast/MTGA/Player.log`;
  }
  if (process.platform == "linux") {
    return `${process.env.HOME}/.wine/drive_c/user/${process.env.USER}/AppData/LocalLow/Wizards of the Coast/MTGA/Player.log`;
  }

  const windowsMtgaLogFolder =
    "LocalLow\\Wizards Of The Coast\\MTGA\\Player.log";

  return electron?.remote.app
    .getPath("appData")
    .replace("Roaming", windowsMtgaLogFolder);
}
