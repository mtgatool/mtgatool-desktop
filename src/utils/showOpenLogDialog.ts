import electron from "./electron/electronWrapper";

export default function showOpenLogDialog(log: string): Promise<any> {
  if (electron) {
    const { dialog } = electron.remote;
    return dialog.showOpenDialog(electron.remote.getCurrentWindow(), {
      title: "Arena Log Location",
      defaultPath: log,
      buttonLabel: "Select",
      filters: [
        { name: "Log Files", extensions: ["log"] },
        { name: "Text", extensions: ["txt", "text"] },
        { name: "All Files", extensions: ["*"] },
      ],
      properties: ["openFile"],
    });
  }
  return new Promise((_resolve, reject) => reject());
}
