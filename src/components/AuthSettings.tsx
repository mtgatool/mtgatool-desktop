/* eslint-disable radix */
/* eslint-disable no-alert */
/* eslint-disable no-restricted-globals */
import { useCallback, useState } from "react";
import { format, fromUnixTime } from "date-fns";
import { database } from "mtgatool-shared";

import info from "../info.json";

import { ReactComponent as Close } from "../assets/images/svg/close.svg";

import Toggle from "./ui/Toggle";

import showOpenLogDialog from "../utils/showOpenLogDialog";
import setLocalSetting from "../utils/setLocalSetting";
import getLocalSetting from "../utils/getLocalSetting";
import openExternal from "../utils/openExternal";
import isElectron from "../utils/electron/isElectron";

import NetworkSettingsPanel from "./views/settings/NetworkSettingsPanel";

import DaemonSettingsPanel from "./views/settings/DaemonSettingsPanel";

function clickBetaChannel(value: boolean): void {
  setLocalSetting("betaChannel", value ? "true" : "false");
}

function getLogExists(path: string) {
  // eslint-disable-next-line global-require
  const fs = require("fs");
  return fs.existsSync(path);
}

interface AuthSettingsProps {
  onClose: () => void;
}

export default function AuthSettings(props: AuthSettingsProps): JSX.Element {
  const { onClose } = props;
  const [path, setPath] = useState(getLocalSetting("logPath"));

  // Arena log controls
  const arenaLogCallback = useCallback((value: string): void => {
    if (value === getLocalSetting("logPath")) return;
    setLocalSetting("logPath", value);
    setPath(value);
    // This restart is not really needed since we are doing this before the app really starts reading the log
    // Only do this if we are changing the path once the app started.
    // const confirmation = confirm(
    //   "Changing the Arena log location requires a restart to take effect, are you sure?"
    // );
    // if (confirmation) {
    // setLocalSetting("logPath", value);
    //   if (isElectron()) {
    //     restartApp();
    //   }
    // }
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

  const logFileExists = isElectron() ? getLogExists(path) : false;

  return (
    <>
      <div className="close-button" onClick={onClose}>
        <Close fill="var(--color-text-hover)" />
      </div>
      <div className="popup-inner" style={{ color: "var(--color-back)" }}>
        <div className="title">Settings</div>
        {isElectron() && (
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
            <div
              title={logFileExists ? "File exists" : "File does not exist"}
              className={logFileExists ? "log-status-ok" : "log-status-err"}
              style={{ marginLeft: "16px" }}
            />
          </div>
        )}
        <div style={{ marginTop: "16px" }} />
        {isElectron() && (
          <>
            <DaemonSettingsPanel />
            <Toggle
              text="Beta updates channel"
              value={getLocalSetting("betaChannel") == "true"}
              callback={clickBetaChannel}
              style={{ marginTop: "16px" }}
              margin={false}
            />
          </>
        )}

        <NetworkSettingsPanel />

        <div className="about">
          <p
            style={{ margin: "4px", textDecoration: "underline" }}
            className="link"
            onClick={(): void =>
              openExternal("https://mtgatool.com/release-notes/")
            }
          >
            {`Version ${info.version} - ${info.branch}, ${new Date(
              info.timestamp
            ).toDateString()}`}
          </p>

          {database.metadata ? (
            <p>
              Metadata: v{database.metadata.version || "???"}, updated{" "}
              {database.metadata.updated
                ? format(fromUnixTime(database.metadata.updated / 1000), "Pp")
                : "???"}
            </p>
          ) : (
            <></>
          )}
          <button
            type="button"
            style={{ maxWidth: "300px", marginTop: "10px" }}
            className="form-button"
            onClick={(): void => {
              // check updates
            }}
          >
            Check for Updates
          </button>
        </div>
      </div>
    </>
  );
}
