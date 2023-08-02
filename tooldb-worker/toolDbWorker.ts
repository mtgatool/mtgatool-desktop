/* eslint-disable no-restricted-globals */

import { ToolDb, ToolDbNetwork } from "mtgatool-db";

import { DEFAULT_PEERS } from "./constants";
import doFunction from "./doFunction";
import getData from "./getData";
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
  console.warn("ToolDb connected!");
  self.postMessage({ type: "CONNECTED" });
};

self.toolDb = toolDb;

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

    case "PUT_DATA":
      self.toolDb.putData(e.data.key, e.data.data, e.data.userNamespaced);
      break;

    case "GET_DATA":
      getData(e.data.id, e.data.key, e.data.userNamespaced);
      break;

    case "DO_FUNCTION":
      doFunction(e.data.id, e.data.fname, e.data.args);
      break;

    default:
      break;
  }
};
