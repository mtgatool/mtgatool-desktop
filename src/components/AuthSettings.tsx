/* eslint-disable radix */
/* eslint-disable no-alert */
/* eslint-disable no-restricted-globals */
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { format, fromUnixTime } from "date-fns";
import { database } from "mtgatool-shared";

import fs from "fs";
import info from "../info.json";

import { ReactComponent as Close } from "../assets/images/svg/close.svg";

import Toggle from "./ui/Toggle";

import showOpenLogDialog from "../utils/showOpenLogDialog";
import setLocalSetting from "../utils/setLocalSetting";
import getLocalSetting from "../utils/getLocalSetting";
import openExternal from "../utils/openExternal";
import isElectron from "../utils/electron/isElectron";

import NetworkSettingsPanel from "./views/settings/NetworkSettingsPanel";
import Button from "./ui/Button";

import globalData from "../utils/globalData";

function clickBetaChannel(value: boolean): void {
  setLocalSetting("betaChannel", value ? "true" : "false");
}

interface AuthSettingsProps {
  onClose: () => void;
}

export default function AuthSettings(props: AuthSettingsProps): JSX.Element {
  const { onClose } = props;
  const [path, setPath] = useState(getLocalSetting("logPath"));
  const [daemonStatus, setDaemonStatus] = useState("warn");

  const [daemonPort, setDaemonPort] = useState(
    parseInt(getLocalSetting("daemonPort"))
  );

  const [daemonPortReal, setDaemonPortReal] = useState(
    parseInt(getLocalSetting("daemonPort"))
  );

  const handleSetDaemonPort = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setDaemonPort(parseInt(event.target.value));
    },
    []
  );

  const changeDaemonPort = useCallback((): void => {
    if (globalData.daemon) {
      globalData.daemon.port = daemonPort;
    }
    setDaemonPortReal(daemonPort);
  }, [daemonPort]);

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

  const logFileExists = fs.existsSync(path);

  useEffect(() => {
    if (globalData.daemon) {
      globalData.daemon
        .getStatus()
        .then((s) => {
          if (s && s.isRunning) {
            setDaemonStatus("ok");
          } else {
            setDaemonStatus("err");
          }
        })
        .catch(() => {
          setDaemonStatus("warn");
        });
    } else {
      setDaemonStatus("warn");
    }
  }, [daemonPortReal]);

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
        <div
          className="input-container"
          style={{
            height: "40px",
          }}
        >
          <label className="label">MTGA Tracker Daemon Port:</label>
          <div
            style={{
              display: "flex",
              width: "120px",
              margin: "0 0 0 32px",
            }}
          >
            <div
              className="form-input-container"
              style={{ padding: "0", margin: "auto" }}
            >
              <input
                onChange={handleSetDaemonPort}
                autoComplete="off"
                type="text"
                value={daemonPort}
              />
            </div>
          </div>
          <Button
            text="Set and check"
            style={{ margin: "auto auto auto 32px" }}
            onClick={changeDaemonPort}
          />
          <div className={`log-status-${daemonStatus}`} />
        </div>

        <Toggle
          text="Beta updates channel"
          value={getLocalSetting("betaChannel") == "true"}
          callback={clickBetaChannel}
          style={{ marginTop: "16px" }}
          margin={false}
        />

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
