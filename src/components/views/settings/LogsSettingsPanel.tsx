import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import postChannelMessage from "../../../broadcastChannel/postChannelMessage";
import { AppState } from "../../../redux/stores/rendererStore";
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
  const logMode = useSelector((state: AppState) => state.renderer.logMode);
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
        disabled={logMode === "reread"}
        onClick={() => {
          // Force a full re-parse of the current log for matches (recovers
          // games played while the tracker was off), then reconcile to cloud.
          postChannelMessage({ type: "REREAD_LOG" });
        }}
        text={logMode === "reread" ? "Re-reading log…" : "Re-read log"}
      />

      <ReaderStatus />
    </>
  );
}
