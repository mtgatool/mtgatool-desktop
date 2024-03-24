/* eslint-disable no-nested-ternary */
/* eslint-disable radix */
import { useEffect, useState } from "react";

import globalData from "../../../utils/globalData";

export default function DaemonSettingsPanel(): JSX.Element {
  const [daemonStatus, setDaemonStatus] = useState("warn");

  useEffect(() => {
    if (globalData.mtgaReader.status === "CONNECTED") setDaemonStatus("ok");
    else if (globalData.mtgaReader.status === "DISCONNECTED")
      setDaemonStatus("err");
    else setDaemonStatus("warn");
  }, []);

  return (
    <>
      <div className="log-status-text">
        <label className="label">MTGA:</label>
        <div className={`log-status-${daemonStatus}`} />
      </div>
    </>
  );
}
