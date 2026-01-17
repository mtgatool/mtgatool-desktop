/* eslint-disable no-nested-ternary */
/* eslint-disable radix */
import _ from "lodash";
import { useEffect, useState } from "react";

import { ConnectionData } from "../../../types/app";

export default function NetworkSettingsPanel(): JSX.Element {
  const [connectionData, setConnectionData] = useState<ConnectionData[]>([]);

  const requestConnectionData = () => {
    if (window.toolDbWorker) {
      window.toolDbWorker.postMessage({
        type: "GET_CONNECTION_DATA",
      });
    }
  };

  useEffect(() => {
    const listener = (e: any) => {
      const { type, value } = e.data;
      if (type === `CONNECTION_DATA`) {
        setConnectionData(value);
      }
    };

    if (window.toolDbWorker) {
      window.toolDbWorker.addEventListener("message", listener);
      requestConnectionData();
    }

    const interval = setInterval(requestConnectionData, 1000);

    return () => {
      clearInterval(interval);
      if (window.toolDbWorker) {
        window.toolDbWorker.removeEventListener("message", listener);
      }
    };
  }, []);

  return (
    <>
      <p>Connected Peers (P2P WebRTC):</p>
      <p style={{ fontSize: "12px", color: "#888", marginBottom: "16px" }}>
        In the new P2P architecture, peers are discovered automatically via
        WebRTC trackers and Nostr relays.
      </p>
      {connectionData.length === 0 ? (
        <p style={{ color: "#888" }}>
          No peers connected. Searching for peers...
        </p>
      ) : (
        connectionData.map((conn) => {
          return (
            <div
              key={`${conn.peerId}-active-peer`}
              style={{
                display: "flex",
                height: "24px",
                lineHeight: "24px",
                maxWidth: "600px",
                margin: "0px auto",
              }}
            >
              <div
                className={`log-status-${conn.isConnected ? "ok" : "err"}`}
              />

              <div style={{ width: "500px" }}>{conn.host}</div>

              <div
                style={{
                  marginLeft: "auto",
                  color: conn.isConnected ? "#4a4" : "#a44",
                }}
              >
                {conn.isConnected ? "Connected" : "Disconnected"}
              </div>
            </div>
          );
        })
      )}

      <div style={{ marginTop: "24px" }}>
        <p>
          The application uses a decentralized P2P network for data
          synchronization. Peers are discovered automatically through WebTorrent
          trackers and Nostr relays.
        </p>
      </div>
    </>
  );
}
