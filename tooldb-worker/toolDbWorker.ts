/* eslint-disable no-restricted-globals */

import { ToolDb, ToolDbNetwork } from "mtgatool-db";

import { DEFAULT_PEERS } from "./constants";
import login from "./login";
import signup from "./signup";

const toolDb = new ToolDb({
  topic: "mtgatool-db-swarm-v4",
  debug: true,
  server: false,
});

toolDb.on("init", (key) => console.warn("ToolDb initialized!", key));

DEFAULT_PEERS.forEach((peer) => {
  const networkModule = toolDb.network as ToolDbNetwork;
  networkModule.findServer(peer);
});

toolDb.onConnect = () => {
  toolDb.onConnect = () => {
    window.postMessage({ type: "CONNECTED" });
  };
};

window.toolDb = toolDb;

self.onmessage = (e: any) => {
  const { type } = e.data;

  switch (type) {
    case "LOGIN":
      login(e.data.username, e.data.password);
      break;

    case "KEYS_LOGIN":
      login(e.data.username, e.data.keys);
      break;

    case "SIGNUP":
      signup(e.data.username, e.data.password);
      break;

    default:
      break;
  }
};
