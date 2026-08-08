import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import postChannelMessage from "../../../broadcastChannel/postChannelMessage";
import reduxAction from "../../../redux/reduxAction";
import isElectron from "../../../utils/electron/isElectron";
import getLocalSetting from "../../../utils/getLocalSetting";
import globalData from "../../../utils/globalData";
import setLocalSetting from "../../../utils/setLocalSetting";
import showOpenLogDialog from "../../../utils/showOpenLogDialog";
import Button from "../../ui/Button";
import StatusPill from "../../ui/StatusPill";
import ReaderActivity from "./ReaderActivity";
import ReaderStatus from "./ReaderStatus";

function getLogExists(path: string) {
  // eslint-disable-next-line global-require
  const fs = require("fs");
  return fs.existsSync(path);
}

export default function LogsSettingsPanel(): JSX.Element {
  const dispatch = useDispatch();
  const lastLogUpdate = globalData.lastLogCheck;
  const [path, setPath] = useState(getLocalSetting("logPath"));
  const [_rerender, setRerender] = useState(0);

  setTimeout(() => setRerender(new Date().getTime()), 500);

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

  const logFileExists = isElectron() ? getLogExists(path) : false;

  return (
    <>
      <div className="panel-card">
        <div className="panel-card-head">
          <div className="panel-card-title">Arena log</div>
          <StatusPill
            state={isReading ? "ok" : "warn"}
            label={isReading ? "Reading" : "Idle"}
            title={
              isReading
                ? "The log is being watched for new entries"
                : "Nothing is being read — start MTGA, or resume reading below"
            }
          />
        </div>

        <div className="panel-row">
          <div className="panel-row-label">Log file</div>
          <div className="panel-row-value">
            <div
              className="open-button"
              onClick={openPathDialog}
              title="Choose a different Player.log"
            />
            <div className="form-input-container">
              {/* Long paths are cut off by the field, so the whole one is on
                  hover rather than nowhere. */}
              <input autoComplete="off" readOnly value={path} title={path} />
            </div>
          </div>
        </div>

        <div className="panel-card-foot">
          <StatusPill
            state={logFileExists ? "ok" : "err"}
            label={logFileExists ? "File found" : "File missing"}
            title={
              logFileExists
                ? path
                : `No file at ${path} — pick the Player.log with the folder button`
            }
          />
          <Button
            onClick={() => {
              postChannelMessage({
                type: isReading ? "STOP_LOG_READING" : "START_LOG_READING",
              });
              reduxAction(dispatch, {
                type: "SET_READING_LOG",
                arg: true,
              });
            }}
            title={
              isReading
                ? "Stop watching the Arena log for new entries"
                : "Pick the log back up from where it is now — this does not replay what has already been read"
            }
            text={isReading ? "Stop reading log" : "Resume reading log"}
          />
        </div>
      </div>

      <ReaderStatus />
      <ReaderActivity />
    </>
  );
}
