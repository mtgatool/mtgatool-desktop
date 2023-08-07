import { useEffect, useState } from "react";

import { ConnectionData } from "../types/app";

export default function ActivePeers() {
  const [_refresh, setRefresh] = useState(0);

  useEffect(() => {
    const doRefresh = () => {
      setRefresh(new Date().getTime());
    };
    const interval = setInterval(doRefresh, 1000);

    return () => clearInterval(interval);
  });

  const [connectionData, setConnectionData] = useState<ConnectionData[]>([]);

  useEffect(() => {
    const listener = (e: any) => {
      const { type, value } = e.data;
      if (type === `CONNECTION_DATA`) {
        setConnectionData(value);
      }
    };

    if (window.toolDbWorker) {
      window.toolDbWorker.postMessage({
        type: "GET_CONNECTION_DATA",
      });
      window.toolDbWorker.addEventListener("message", listener);
    }

    return () => {
      if (window.toolDbWorker) {
        window.toolDbWorker.removeEventListener("message", listener);
      }
    };
  }, []);

  return (
    <>
      <p
        style={{
          marginTop: "16px",
        }}
      >
        Active peers:
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          marginTop: "8px",
        }}
      >
        {connectionData.map((conn) => {
          return (
            <div
              key={`${conn.peerId}-active-peer`}
              style={{
                display: "flex",
                height: "16px",
                lineHeight: "16px",
                margin: "0 auto",
                maxWidth: "400px",
                width: "100%",
                marginTop: "4px",
              }}
            >
              <div
                className={`log-status-${conn.isConnected ? "ok" : "warn"}`}
              />
              <div style={{ margin: "auto" }}>{conn.host}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
