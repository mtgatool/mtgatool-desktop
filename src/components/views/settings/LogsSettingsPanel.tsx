import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import postChannelMessage from "../../../broadcastChannel/postChannelMessage";
import reduxAction from "../../../redux/reduxAction";
import getLocalSetting from "../../../utils/getLocalSetting";
import globalData from "../../../utils/globalData";
import setLocalSetting from "../../../utils/setLocalSetting";
import showOpenLogDialog from "../../../utils/showOpenLogDialog";
import isTauri from "../../../utils/tauri/isTauri";
import Button from "../../ui/Button";
import ReaderStatus from "./ReaderStatus";

// Note: This is async but we use state to track the result
async function checkLogExists(path: string): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    const { exists } = await import("@tauri-apps/plugin-fs");
    return await exists(path);
  } catch {
    return false;
  }
}

export default function LogsSettingsPanel(): JSX.Element {
  const dispatch = useDispatch();
  const lastLogUpdate = globalData.lastLogCheck;
  const [path, setPath] = useState(getLocalSetting("logPath"));
  const [_rerender, setRerender] = useState(0);
  const [logFileExists, setLogFileExists] = useState(false);

  setTimeout(() => setRerender(new Date().getTime()), 500);

  // Check if log file exists
  useEffect(() => {
    checkLogExists(path).then(setLogFileExists);
  }, [path]);

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

  const isReading = new Date().getTime() - lastLogUpdate < 1000;

  return (
    <>
      <div className="log-status-text">
        Status:{" "}
        <div
          title={isReading ? `Reading` : "Not reading"}
          className={isReading ? `log-status-ok` : "log-status-err"}
        />
      </div>
      <div className="input-container" style={{ height: "40px" }}>
        <label className="label">Arena Log:</label>
        <div
          style={{
            display: "flex",
            width: "-webkit-fill-available",
            justifyContent: "flex-end",
          }}
        >
          <div className="open-button" onClick={openPathDialog} />
          <div className="form-input-container">
            <input autoComplete="off" readOnly value={path} />
          </div>
        </div>
        <div
          title={logFileExists ? "File exists" : "File does not exist"}
          className={logFileExists ? "log-status-ok" : "log-status-err"}
          style={{ marginLeft: "16px" }}
        />
      </div>

      <Button
        style={{
          margin: "16px auto",
        }}
        onClick={() => {
          postChannelMessage({
            type: isReading ? "STOP_LOG_READING" : "START_LOG_READING",
          });
          reduxAction(dispatch, {
            type: "SET_READING_LOG",
            arg: true,
          });
        }}
        text={isReading ? "Stop reading log" : "Re-read log"}
      />

      <ReaderStatus />
    </>
  );
}
