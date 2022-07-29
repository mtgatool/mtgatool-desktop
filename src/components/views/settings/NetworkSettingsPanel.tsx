/* eslint-disable no-nested-ternary */
/* eslint-disable radix */
import _ from "lodash";
import { ChangeEvent, useCallback, useState } from "react";
import { ToolDbNetwork } from "mtgatool-db";

import { Peer } from "../../../redux/slices/rendererSlice";
import getLocalSetting from "../../../utils/getLocalSetting";
import { getFinalHost } from "../../../utils/peerToUrl";
import setLocalSetting from "../../../utils/setLocalSetting";
import vodiFn from "../../../utils/voidfn";

import Button from "../../ui/Button";

function _getPeerFromUrl(url: string) {
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

export default function NetworkSettingsPanel(): JSX.Element {
  const peers: Peer[] = JSON.parse(getLocalSetting("peers"));
  const [_rerender, setRerender] = useState(0);

  const [newHost, setNewHost] = useState("localhost");
  const [newPort, setNewPort] = useState(3000);

  setTimeout(() => setRerender(new Date().getTime()), 500);

  const networkModule = window.toolDb.network as ToolDbNetwork;

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

  const connections = Object.keys(networkModule.clientToSend);

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

  const _connectPeer = (host: string, port: number) => {
    networkModule.connectTo(getFinalHost(host), port);
  };

  const _disconnectPeer = (clientId: string) => {
    console.log("Client ID disconnect", clientId);
    // networkModule.close(clientId);
  };

  return (
    <>
      <p>Peers:</p>
      {connections.map((peerId: string) => {
        const host = window.toolDb.peers[peerId]?.host;
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
              {peerHost}
              {networkModule.isServer(peerId) ? <i>(server)</i> : ""}
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
