/* eslint-disable no-nested-ternary */
/* eslint-disable radix */
import { ChangeEvent, useCallback, useState } from "react";
import { ToolDbWebSocket } from "tool-db/dist/wss";
import { Peer } from "../../../redux/slices/rendererSlice";
import getLocalSetting from "../../../utils/getLocalSetting";
import peerToUrl from "../../../utils/peerToUrl";
import setLocalSetting from "../../../utils/setLocalSetting";

import Button from "../../ui/Button";

export default function NetworkSettingsPanel(): JSX.Element {
  const peers: Peer[] = JSON.parse(getLocalSetting("peers"));
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

  const connections = Object.values(window.toolDb.websockets.clientSockets);

  const removePeer = (clientId: string) => {
    const slicedPeers = [...peers];
    const index = connections.findIndex((s) => s.toolDbId === clientId);
    if (index !== -1) {
      slicedPeers.splice(index, 1);
      setLocalSetting("peers", JSON.stringify(slicedPeers));
    }
    if (connections) {
      window.toolDb.websockets.close(clientId);
    }
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

  const connectPeer = (url: string) => {
    window.toolDb.websockets.open(url);
  };

  const disconnectPeer = (clientId: string) => {
    console.log("Client ID disconnect", clientId);
    window.toolDb.websockets.close(clientId);
  };

  const connectionUrls = connections.map((c) => c.origUrl);

  return (
    <>
      <p>Peers:</p>
      {peers.map((p: Peer) => {
        const url = peerToUrl(p);
        if (connectionUrls.includes(url)) {
          return <div key={`${url}-active-peer`}>{url}</div>;
        }

        const connectionUrl: ToolDbWebSocket | undefined = connections.filter(
          (s) => s.origUrl === url
        )[0];

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
                connectionUrl
                  ? connectionUrl.readyState === 1
                    ? "ok"
                    : "warn"
                  : "err"
              }`}
            />

            <div style={{ width: "500px" }}>{url}</div>

            <Button
              text={connectionUrl ? "Disconnect" : "Connect"}
              style={{ margin: "0 8px", minWidth: "100px", width: "100px" }}
              className="button-simple button-edit"
              onClick={
                connectionUrl
                  ? () => disconnectPeer(connectionUrl.toolDbId || "")
                  : () => connectPeer(url)
              }
            />

            <Button
              text="Remove"
              style={{ margin: "0 8px", minWidth: "100px", width: "100px" }}
              className="button-simple button-edit"
              onClick={() => removePeer(connectionUrl.toolDbId || "")}
            />
          </div>
        );
      })}
      {connections.map((s) => {
        const { url } = s;

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
              className={`log-status-${s.readyState === 1 ? "ok" : "warn"}`}
            />

            <div style={{ width: "500px" }}>{url}</div>

            <Button
              text={s.readyState === 1 ? "Disconnect" : "Connect"}
              style={{ margin: "0 8px", minWidth: "100px", width: "100px" }}
              className="button-simple button-edit"
              onClick={
                s.readyState === 1
                  ? () => disconnectPeer(s.toolDbId || "")
                  : () => connectPeer(url)
              }
            />

            <Button
              text="Remove"
              style={{ margin: "0 8px", minWidth: "100px", width: "100px" }}
              className="button-simple button-edit"
              onClick={() => removePeer(s.toolDbId || "")}
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
