import { OpenDialogReturnValue, remote } from "electron";

const { dialog } = remote;

export default function showOpenLogDialog(
  log: string
): Promise<OpenDialogReturnValue> {
  return dialog.showOpenDialog(remote.getCurrentWindow(), {
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
