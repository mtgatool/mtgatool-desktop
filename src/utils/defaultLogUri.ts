export default function defaultLogUri(): string {
  if (process.platform == "darwin") {
    // Untested! default path for logs in MacOs.
    // return `${process.env.HOME}/Users/${process.env.USER}/Library/Logs/Wizards Of The Coast/MTGA/Player.log`;
    return `${process.env.HOME}/Library/Logs/Wizards Of The Coast/MTGA/Player.log`;
  }
  if (process.platform == "linux") {
    return `${process.env.HOME}/.wine/drive_c/user/${process.env.USER}/AppData/LocalLow/Wizards of the Coast/MTGA/Player.log`;
  }

  const windowsMtgaLogFolder =
    "LocalLow\\Wizards Of The Coast\\MTGA\\Player.log";

  return (
    process.env.APPDATA?.replace("Roaming", windowsMtgaLogFolder) ??
    `c:\\users\\${
      (process.env.USERNAME ?? process.env.USER) || "manue"
    }\\AppData\\${windowsMtgaLogFolder}`
  );
}
