/* eslint-disable no-nested-ternary */
/* eslint-disable radix */
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import getLocalSetting from "../../../utils/getLocalSetting";
import globalData from "../../../utils/globalData";
import openExternal from "../../../utils/openExternal";

import Button from "../../ui/Button";

export default function DaemonSettingsPanel(): JSX.Element {
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
      <div style={{ margin: "24px 0 12px 0" }}>
        <p>
          Mtga Tracker Daemon is a utility service app that reads MTG
          Arena&apos;s process memory to access some of the information that is
          not available on the logs. You can read more about it here;{" "}
          <a
            className="link"
            onClick={(): void =>
              openExternal("https://github.com/frcaton/mtga-tracker-daemon")
            }
          >
            mtga-tracker-daemon
          </a>
        </p>
      </div>
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
    </>
  );
}
