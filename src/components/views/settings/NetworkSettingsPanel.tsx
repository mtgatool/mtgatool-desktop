/* eslint-disable no-nested-ternary */
/* eslint-disable radix */
import _ from "lodash";
import { ToolDbNetwork } from "mtgatool-db";
import { ChangeEvent, useCallback, useState } from "react";

import getLocalSetting from "../../../utils/getLocalSetting";
import setLocalSetting from "../../../utils/setLocalSetting";
import vodiFn from "../../../utils/voidfn";
import Button from "../../ui/Button";

export default function NetworkSettingsPanel(): JSX.Element {
  const peers: string[] = JSON.parse(getLocalSetting("peer-keys"));
  const [_rerender, setRerender] = useState(0);

  const [newHost, setNewHost] = useState("");

  setTimeout(() => setRerender(new Date().getTime()), 500);

  const networkModule = window.toolDb.network as ToolDbNetwork;

  const handleSetHost = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setNewHost(event.target.value);
    },
    []
  );

  const connections = Object.keys(networkModule.clientToSend);

  const addPeer = () => {
    const newPeers = [...peers, newHost];

    networkModule.findServer(newHost);
    setNewHost("");
    setLocalSetting("peer-keys", JSON.stringify(newPeers));
  };

  return (
    <>
      <p>Peers:</p>
      {connections.map((peerId: string) => {
        const peerData = networkModule.serverPeerData[peerId];
        const host = window.toolDb.peers[peerId.slice(-20)]?.host;
        const peerHost =
          !host || host === "127.0.0.1" ? peerId.slice(-20) : host;
        return (
          <div
            key={`${peerId}-active-peer`}
            style={{
              display: "flex",
              height: "24px",
              lineHeight: "24px",
              maxWidth: "600px",
              margin: "0px auto",
            }}
          >
            <div
              className={`log-status-${
                networkModule.isClientConnected[peerId]
                  ? networkModule.isClientConnected[peerId]()
                    ? "ok"
                    : "warn"
                  : "err"
              }`}
            />

            <div style={{ width: "500px" }}>
              {peerData.name || peerHost}
              {networkModule.isServer(peerId) ? <i> (server)</i> : ""}
            </div>

            <Button
              text={
                networkModule.isClientConnected[peerId] &&
                networkModule.isClientConnected[peerId]()
                  ? "Disconnect"
                  : "Connect"
              }
              style={{ margin: "0 8px", minWidth: "100px", width: "100px" }}
              className="button-simple button-edit"
              onClick={vodiFn}
            />

            <Button
              text="Remove"
              style={{ margin: "0 8px", minWidth: "100px", width: "100px" }}
              className="button-simple button-edit"
              onClick={vodiFn}
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
