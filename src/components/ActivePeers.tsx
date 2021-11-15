import { useEffect, useState } from "react";

export default function ActivePeers() {
  const [_refresh, setRefresh] = useState(0);

  useEffect(() => {
    const doRefresh = () => {
      setRefresh(new Date().getTime());
    };
    const interval = setInterval(doRefresh, 1000);

    return () => clearInterval(interval);
  });

  const connections = (window.toolDb.websockets as any)._connections;

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
        {Object.keys(connections).map((url) => {
          return (
            <div
              key={`${url}-active-peer`}
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
                className={`log-status-${
                  connections[url].peer.readyState === 1 ? "ok" : "warn"
                }`}
              />
              <div style={{ margin: "auto" }}>{url}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
