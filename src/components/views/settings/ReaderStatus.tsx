import { useEffect, useState } from "react";

function findMTGA(): boolean {
  // eslint-disable-next-line no-undef
  const reader = __non_webpack_require__("mtga-reader");
  const { findPidByName } = reader;
  return findPidByName("MTGA");
}

export default function ReaderStatus() {
  const [daemonStatus, setDaemonStatus] = useState("warn");

  useEffect(() => {
    const interval = setInterval(() => {
      const found = findMTGA();
      if (found) {
        setDaemonStatus("ok");
      } else {
        setDaemonStatus("err");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div style={{ margin: "24px 0 12px 0" }}>
        <p>
          MTG Arena Tool reads the MTGA game process memory to get the some of
          the game data, if you have any issues with it try running the app with
          administrator privileges.
        </p>
      </div>
      <div
        className="input-container"
        style={{
          height: "40px",
        }}
      >
        <label className="label">MTGA Process:</label>
        <div
          style={{
            display: "flex",
            width: "120px",
            margin: "0 0 0 32px",
          }}
        />
        <div className={`log-status-${daemonStatus}`} />
      </div>
    </>
  );
}
