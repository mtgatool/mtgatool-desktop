/* eslint-disable no-nested-ternary */
/* eslint-disable radix */
import _ from "lodash";
import { ChangeEvent, useCallback, useState } from "react";
import { toolDbNetwork } from "tool-db";
import { ToolDbWebSocket } from "tool-db/dist/wss";
import { Peer } from "../../../redux/slices/rendererSlice";
import getLocalSetting from "../../../utils/getLocalSetting";
import peerToUrl, { knownHosts } from "../../../utils/peerToUrl";
import setLocalSetting from "../../../utils/setLocalSetting";
import vodiFn from "../../../utils/voidfn";

import Button from "../../ui/Button";

function getPeerFromUrl(url: string) {
  const urlParseRegex = new RegExp(
    /^((ftp|http[s]?|ws[s]?):\/\/)?([^/?:#]+)([:/])?([0-9]*)?(\/.*)?$/,
    "g"
  );
  const result = urlParseRegex.exec(url);
  if (!result) {
    return {
      host: "",
      port: 0,
    };
  }
  return {
    host: result[3],
    port:
      result[2] === "https" || result[2] === "wss" ? 443 : parseInt(result[5]),
  };
}

function getFinalHost(host: string) {
  return knownHosts[host] || host;
}

export default function NetworkSettingsPanel(): JSX.Element {
  const peers: Peer[] = JSON.parse(getLocalSetting("peers"));
  const [_rerender, setRerender] = useState(0);

  const [newHost, setNewHost] = useState("localhost");
  const [newPort, setNewPort] = useState(3000);

  setTimeout(() => setRerender(new Date().getTime()), 500);

  const networkModule = window.toolDb.network as toolDbNetwork;

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

  const connections = Object.values(networkModule.clientSockets);

  const removePeer = (host: string, port: number) => {
    const peerIndex = peers.findIndex(
      (p) => getFinalHost(p.host) === getFinalHost(host) && p.port === port
    );
    const slicedPeers = [...peers];
    slicedPeers.splice(peerIndex, 1);
    setLocalSetting("peers", JSON.stringify(slicedPeers));

    connections.forEach((conn) => {
      const p = getPeerFromUrl(conn.url);
      if (getFinalHost(p.host) === getFinalHost(host) && p.port === port) {
        networkModule.close(conn.clientId);
      }
    });
  };

  const addPeer = () => {
    const p: Peer = {
      host: newHost,
      port: newPort,
    };
    const newPeers = [...peers, p];

    networkModule.connectTo(getFinalHost(p.host), p.port);
    setNewHost("localhost");
    setNewPort(3000);
    setLocalSetting("peers", JSON.stringify(newPeers));
  };

  const connectPeer = (host: string, port: number) => {
    networkModule.connectTo(getFinalHost(host), port);
  };

  const disconnectPeer = (clientId: string) => {
    console.log("Client ID disconnect", clientId);
    networkModule.close(clientId);
  };

  const connectionPeers = connections.map((c) => getPeerFromUrl(c.url));

  return (
    <>
      <p>Peers:</p>
      {peers.map((p: Peer) => {
        const url = peerToUrl(p);
        if (
          connectionPeers.filter(
            (c) =>
              getFinalHost(p.host) === getFinalHost(c.host) && p.port === c.port
          ).length > 0
        ) {
          return <></>;
        }

        const connectionUrl: ToolDbWebSocket | undefined = connections.filter(
          (s) => {
            const _peer = getPeerFromUrl(s.url);
            return _.isEqual(_peer, p);
          }
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

            <div style={{ width: "500px" }}>
              {getFinalHost(p.host)}:{p.port}
            </div>

            <Button
              text={connectionUrl ? "Disconnect" : "Connect"}
              style={{ margin: "0 8px", minWidth: "100px", width: "100px" }}
              className="button-simple button-edit"
              onClick={
                connectionUrl
                  ? () => disconnectPeer(connectionUrl.toolDbId || "")
                  : () => connectPeer(p.host, p.port)
              }
            />

            <Button
              text="Remove"
              style={{ margin: "0 8px", minWidth: "100px", width: "100px" }}
              className="button-simple button-edit"
              onClick={() => removePeer(p.host, p.port)}
            />
          </div>
        );
      })}
      {connections.map((s) => {
        const { url } = s;

        const { host, port } = getPeerFromUrl(url);

        return (
          <div
            key={`${s.connId}-active-peer`}
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

            <div style={{ width: "500px" }}>
              {getFinalHost(host)}:{port}
            </div>

            <Button
              text={s.readyState === 1 ? "Disconnect" : "Connect"}
              style={{ margin: "0 8px", minWidth: "100px", width: "100px" }}
              className="button-simple button-edit"
              onClick={
                s.readyState === 1
                  ? () => disconnectPeer(s.toolDbId || "")
                  : vodiFn
              }
            />

            <Button
              text="Remove"
              style={{ margin: "0 8px", minWidth: "100px", width: "100px" }}
              className="button-simple button-edit"
              onClick={() => removePeer(host, port)}
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
