/* eslint-disable no-restricted-globals */

import { ServerPeerData, sha1, ToolDb, ToolDbNetwork } from "mtgatool-db";

import { DEFAULT_PEERS } from "./constants";
import doFunction from "./doFunction";
import { beginDataQuery } from "./exploreAggregation";
import getConnectionData from "./getConnectionData";
import getCrdt from "./getCrdt";
import getData from "./getData";
import getDataLocal from "./getDataLocal";
import { getMatchesData } from "./getMatchesData";
import getSaveKeysJson from "./getSaveKeysJson";
import handleMatchesIndex from "./handleMatchesIndex";
import keysLogin from "./keysLogin";
import login from "./login";
import pushToExplore from "./pushToExplore";
import pushToLiveFeed from "./pushToLivefeed";
import queryKeys from "./queryKeys";
import signup from "./signup";

const toolDb = new ToolDb({
  topic: "mtgatool-db-swarm-v4",
  // debug: true,
  server: false,
});

const SERVERS_KEY = sha1("-.servers.-");

toolDb.on("init", (key) => console.warn("ToolDb initialized!", key));

// Try to conenct to servers from cache
toolDb.store.get(SERVERS_KEY, (err, data) => {
  let serversData: Record<string, ServerPeerData> = {};
  if (err) {
    console.error("Error getting servers from cache:", err);
  } else if (data) {
    try {
      serversData = JSON.parse(data);
    } catch (_e) {
      console.error("Error parsing servers from cache:", _e);
    }
  }

  console.log("Got servers from cache:", serversData);

  DEFAULT_PEERS.forEach((peer) => {
    const networkModule = toolDb.network as ToolDbNetwork;
    if (serversData[peer]) {
      networkModule.connectTo(serversData[peer]);
    } else {
      networkModule.findServer(peer);
    }
  });
});

toolDb.onConnect = () => {
  const networkModule = toolDb.network as ToolDbNetwork;
  console.warn("ToolDb connected!");
  self.postMessage({ type: "CONNECTED" });
  toolDb.store.put(
    SERVERS_KEY,
    JSON.stringify(networkModule.serverPeerData),
    () => console.log("Saved servers to cache", networkModule.serverPeerData)
  );
};

self.toolDb = toolDb;

self.globalData = {
  hiddenDecks: [],
  liveFeed: {},
  fetchedAvatars: [],
  matchesIndex: [],
  draftsIndex: [],
  currentUUID: "",
};

self.onmessage = (e: any) => {
  const { type } = e.data;

  // console.log("Worker onmessage:", e.type, e.data);

  switch (type) {
    case "LOGIN":
      login(e.data.username, e.data.password);
      break;

    case "KEYS_LOGIN":
      keysLogin(e.data.username, e.data.keys);
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

    case "GET_CRDT":
      getCrdt(e.data.id, e.data.key, e.data.userNamespaced, e.data.timeoutMs);
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

    case "GET_CONNECTION_DATA":
      getConnectionData();
      break;

    case "FIND_SERVER":
      (self.toolDb.network as ToolDbNetwork).findServer(e.data.host);
      break;

    case "GET_SAVE_KEYS_JSON":
      getSaveKeysJson();
      break;

    // application specific handlers

    case "PUSH_DB_MATCH":
      pushToExplore(e.data.key, e.data.match);
      pushToLiveFeed(e.data.key, e.data.match);
      break;

    case "EXPLORE_DATA_QUERY":
      beginDataQuery(e.data.days, e.data.event);
      break;

    case "GET_MATCHES_DATA":
      getMatchesData(e.data.id, e.data.matchesIndex, e.data.uuid);
      break;

    case "REFRESH_MATCHES":
      if (self.toolDb.user) {
        self.toolDb
          .queryKeys(`:${self.toolDb.user.pubKey}.matches-`, false, 5000)
          .then(handleMatchesIndex);
      }
      break;

    default:
      break;
  }
};
