/* eslint-disable no-alert */
/* eslint-disable no-restricted-globals */
import { useCallback } from "react";
import { format, fromUnixTime } from "date-fns";
import { database } from "mtgatool-shared";

import { ReactComponent as Close } from "../assets/images/svg/close.svg";

import Toggle from "./ui/Toggle";

import showOpenLogDialog from "../utils/showOpenLogDialog";
import setLocalSetting from "../utils/setLocalSetting";
import getLocalSetting from "../utils/getLocalSetting";
import openExternal from "../utils/openExternal";

function clickBetaChannel(value: boolean): void {
  setLocalSetting("betaChannel", value ? "true" : "false");
}

interface AuthSettingsProps {
  onClose: () => void;
}

export default function AuthSettings(props: AuthSettingsProps): JSX.Element {
  const { onClose } = props;

  // Arena log controls
  const arenaLogCallback = useCallback((value: string): void => {
    if (value === getLocalSetting("logPath")) return;
    const confirmation = confirm(
      "Changing the Arena log location requires a restart to take effect, are you sure?"
    );
    if (confirmation) {
      setLocalSetting("logPath", value);
    }
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
      <div className="close-button" onClick={onClose}>
        <Close fill="var(--color-text-hover)" />
      </div>
      <div className="popup-inner" style={{ color: "var(--color-back)" }}>
        <div className="title">Settings</div>
        <div className="input-container">
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
              <input
                autoComplete="off"
                readOnly
                value={getLocalSetting("logPath")}
              />
            </div>
          </div>
        </div>
        <Toggle
          text="Beta updates channel"
          value={getLocalSetting("betaChannel") == "true"}
          callback={clickBetaChannel}
          style={{ marginTop: "16px" }}
          margin={false}
        />
        <div className="about">
          <div
            style={{ margin: "4px", textDecoration: "underline" }}
            className="link"
            onClick={(): void =>
              openExternal("https://mtgatool.com/release-notes/")
            }
          >
            {`Version ${process.env.REACT_APP_VERSION}`}
          </div>
          {database.metadata ? (
            <div style={{ margin: "4px" }}>
              Metadata: v{database.metadata.version || "???"}, updated{" "}
              {database.metadata.updated
                ? format(fromUnixTime(database.metadata.updated / 1000), "Pp")
                : "???"}
            </div>
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
