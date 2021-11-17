/* eslint-disable no-nested-ternary */
/* eslint-disable radix */
import { ChangeEvent, useCallback, useState } from "react";
import { Peer } from "../../../redux/slices/rendererSlice";
import getLocalSetting from "../../../utils/getLocalSetting";
import peerToUrl from "../../../utils/peerToUrl";
import setLocalSetting from "../../../utils/setLocalSetting";

import Button from "../../ui/Button";

export default function NetworkSettingsPanel(): JSX.Element {
  const peers = JSON.parse(getLocalSetting("peers"));
  const [_rerender, setRerender] = useState(0);

  const [newHost, setNewHost] = useState("localhost");
  const [newPort, setNewPort] = useState(3000);

  setTimeout(() => setRerender(new Date().getTime()), 500);

  const handleSetHost = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setNewHost(event.target.value.replace(/(^\w+:|^)\/\/|\//g, ""));
    },
    []
  );

  const handleSetPort = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      setNewPort(parseInt(event.target.value));
    },
    []
  );

  const connections = (window.toolDb.websockets as any)._connections;

  const removePeer = (index: number) => {
    const slicedPeers = [...peers];
    slicedPeers.splice(index, 1);
    const url = peerToUrl(peers[index]);
    if (connections[url]) {
      window.toolDb.websockets.close(url);
    }
    setLocalSetting("peers", JSON.stringify(slicedPeers));
  };

  const addPeer = () => {
    const p: Peer = {
      host: newHost,
      port: newPort,
    };
    const newPeers = [...peers, p];

    const url = peerToUrl(p);
    window.toolDb.websockets.open(url);
    setNewHost("localhost");
    setNewPort(3000);
    setLocalSetting("peers", JSON.stringify(newPeers));
  };

  const connectPeer = (index: number) => {
    const url = peerToUrl(peers[index]);
    window.toolDb.websockets.open(url);
  };

  const disconnectPeer = (index: number) => {
    const url = peerToUrl(peers[index]);
    if (connections[url]) {
      window.toolDb.websockets.close(url);
    }
  };

  return (
    <>
      <p>Peers:</p>
      {peers.map((p: Peer, index: number) => {
        const url = peerToUrl(p);
        return (
          <div
            key={`${url}-active-peer`}
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
                connections[url]
                  ? connections[url].peer.readyState === 1
                    ? "ok"
                    : "warn"
                  : "err"
              }`}
            />

            <div style={{ width: "500px" }}>{url}</div>

            <Button
              text={connections[url] ? "Disconnect" : "Connect"}
              style={{ margin: "0 8px", minWidth: "100px", width: "100px" }}
              className="button-simple button-edit"
              onClick={
                connections[url]
                  ? () => disconnectPeer(index)
                  : () => connectPeer(index)
              }
            />

            <Button
              text="Remove"
              style={{ margin: "0 8px", minWidth: "100px", width: "100px" }}
              className="button-simple button-edit"
              onClick={() => removePeer(index)}
            />
          </div>
        );
      })}
      <div style={{ marginTop: "24px" }}>
        <p>
          You can add a custom server peer host here. Usually servers will be
          acquired automaticaly via DHT, but you might want to deploy your own
          servers or conenct to a different swarm.
        </p>
        <p>Use port 443 to upgrade connections to HTTPS.</p>
      </div>
      <div>
        <div
          className="input-container"
          style={{
            height: "40px",
            margin: "8px 0",
          }}
        >
          <label className="label">Host:</label>
          <div
            style={{
              display: "flex",
              width: "300px",
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
          <label className="label">Port:</label>
          <div
            style={{
              display: "flex",
              width: "120px",
              margin: "0 0 0 16px",
            }}
          >
            <div
              className="form-input-container"
              style={{ padding: "0", margin: "auto" }}
            >
              <input
                onChange={handleSetPort}
                autoComplete="off"
                type="text"
                value={newPort}
              />
            </div>
          </div>
          <Button
            style={{ margin: "auto 16px" }}
            onClick={addPeer}
            text="Add"
          />
        </div>
      </div>
    </>
  );
}
