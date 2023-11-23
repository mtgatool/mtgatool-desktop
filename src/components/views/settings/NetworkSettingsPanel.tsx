/* eslint-disable no-nested-ternary */
/* eslint-disable radix */
import _ from "lodash";
import { ServerPeerData } from "mtgatool-db";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

import { ConnectionData } from "../../../types/app";
import getLocalSetting from "../../../utils/getLocalSetting";
import setLocalSetting from "../../../utils/setLocalSetting";
import Button from "../../ui/Button";

export default function NetworkSettingsPanel(): JSX.Element {
  const peers: string[] = JSON.parse(getLocalSetting("saved-peer-keys"));
  const [_rerender, setRerender] = useState(0);

  const [newHost, setNewHost] = useState("");

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

  setTimeout(() => setRerender(new Date().getTime()), 500);

  const handleSetHost = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setNewHost(event.target.value);
    },
    []
  );

  const addPeer = () => {
    const newPeers = [...peers, newHost];
    if (window.toolDbWorker) {
      window.toolDbWorker.postMessage({
        type: "FIND_SERVER",
        host: newHost,
      });
    }
    setNewHost("");
    setLocalSetting("saved-peer-keys", JSON.stringify(newPeers));
  };

  const connect = (peer: ServerPeerData) => {
    if (window.toolDbWorker) {
      window.toolDbWorker.postMessage({
        type: "CONNECT",
        peer,
      });
    }
  };

  const disconnect = (host: string) => {
    if (window.toolDbWorker) {
      window.toolDbWorker.postMessage({
        type: "DISCONNECT",
        host,
      });
    }
  };

  const remove = (host: string) => {
    if (window.toolDbWorker) {
      window.toolDbWorker.postMessage({
        type: "REMOVE_HOST",
        host,
      });
    }
  };

  return (
    <>
      <p>Peers:</p>
      {connectionData.map((conn) => {
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
            <div className={`log-status-${conn.isConnected ? "ok" : "err"}`} />

            <div style={{ width: "500px" }}>
              {conn.host}
              {conn.peerData.isServer ? <i> (server)</i> : ""}
            </div>

            <Button
              text={conn.isConnected ? "Disconnect" : "Connect"}
              style={{ margin: "0 8px", minWidth: "100px", width: "100px" }}
              className="button-simple button-edit"
              onClick={
                conn.isConnected
                  ? () => disconnect(conn.serverPeerData.pubKey)
                  : () => connect(conn.serverPeerData)
              }
            />

            <Button
              text="Remove"
              style={{ margin: "0 8px", minWidth: "100px", width: "100px" }}
              className="button-simple button-edit"
              onClick={() => remove(conn.serverPeerData.pubKey)}
            />
          </div>
        );
      })}

      <div style={{ marginTop: "24px" }}>
        <p>
          You can add a server peer host here. If you are running a server, you
          can add your own host here. Server connection data will be acquired
          automatically with it Public Key.
        </p>
      </div>
      <div>
        <div
          className="input-container"
          style={{
            height: "40px",
            margin: "8px 0",
          }}
        >
          <label className="label">Public Key:</label>
          <div
            style={{
              display: "flex",
              width: "400px",
              margin: "0 16px",
            }}
          >
            <div
              className="form-input-container"
              style={{ padding: "0", margin: "auto" }}
            >
              <input
                onChange={handleSetHost}
                autoComplete="off"
                type="text"
                value={newHost}
              />
            </div>
          </div>
          <Button
            style={{ margin: "auto 16px" }}
            onClick={addPeer}
            text="Add Server"
          />
        </div>
      </div>
    </>
  );
}
