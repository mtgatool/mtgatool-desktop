/* eslint-disable no-restricted-globals */

import { ToolDb, ToolDbNetwork } from "mtgatool-db";

import { DEFAULT_PEERS } from "./constants";
import doFunction from "./doFunction";
import { beginDataQuery } from "./exploreAggregation";
import getData from "./getData";
import getDataLocal from "./getDataLocal";
import getMatchesData from "./getMatchesData";
import handleMatchesIndex from "./handleMatchesIndex";
import login from "./login";
import queryKeys from "./queryKeys";
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

self.globalData = {
  hiddenDecks: [],
  liveFeed: {},
  fetchedAvatars: [],
  matchesIndex: [],
  draftsIndex: [],
};

self.onmessage = (e: any) => {
  const { type } = e.data;

  // console.log("Worker received message:", e.type, e.data);

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
      getData(e.data.id, e.data.key, e.data.userNamespaced, e.data.timeoutMs);
      break;

    case "GET_LOCAL_DATA":
      getDataLocal(e.data.id, e.data.key);
      break;

    case "QUERY_KEYS":
      queryKeys(e.data.id, e.data.key, e.data.userNamespaced, e.data.timeoutMs);
      break;

    case "DO_FUNCTION":
      doFunction(e.data.id, e.data.fname, e.data.args);
      break;

    // application specific handlers

    case "EXPLORE_DATA_QUERY":
      beginDataQuery(e.data.days, e.data.event);
      break;

    case "GET_MATCHES_DATA":
      getMatchesData(e.data.matchesIndex, e.data.uuid);
      break;

    case "REFRESH_MATCHES":
      if (self.toolDb.user) {
        self.toolDb
          .queryKeys(`:${self.toolDb.user.pubKey}.matches-`)
          .then(handleMatchesIndex);
      }
      break;

    default:
      break;
  }
};
