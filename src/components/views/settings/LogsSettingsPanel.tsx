import { useCallback, useState } from "react";
import postChannelMessage from "../../../broadcastChannel/postChannelMessage";

import getLocalSetting from "../../../utils/getLocalSetting";
import setLocalSetting from "../../../utils/setLocalSetting";
import showOpenLogDialog from "../../../utils/showOpenLogDialog";
import Button from "../../ui/Button";

export default function LogsSettingsPanel(): JSX.Element {
  const [path, setPath] = useState(getLocalSetting("logPath"));

  // Arena log controls
  const arenaLogCallback = useCallback((value: string): void => {
    if (value === getLocalSetting("logPath")) return;
    setLocalSetting("logPath", value);
    setPath(value);
  }, []);

  const openPathDialog = useCallback(() => {
    showOpenLogDialog(getLocalSetting("logPath")).then((value: any): void => {
      // OpenDialogReturnValue
      const paths = value.filePaths;
      if (paths && paths.length && paths[0]) {
        arenaLogCallback(paths[0]);
      }
    });
  }, [arenaLogCallback]);

  return (
    <>
      <div className="input-container" style={{ height: "40px" }}>
        <label className="label">Arena Log:</label>
        <div
          style={{
            display: "flex",
            maxWidth: "80%",
            width: "-webkit-fill-available",
            justifyContent: "flex-end",
          }}
        >
          <div className="open-button" onClick={openPathDialog} />
          <div className="form-input-container">
            <input autoComplete="off" readOnly value={path} />
          </div>
        </div>
      </div>
      <Button
        style={{
          margin: "16px auto",
        }}
        onClick={() => {
          postChannelMessage({
            type: "START_LOG_READING",
          });
        }}
        text="Re-read log"
      />
    </>
  );
}
