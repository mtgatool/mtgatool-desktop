/* eslint-disable no-restricted-globals */

import ToolDbEcdsaUser from "@tool-db/ecdsa-user";
import ToolDbIndexedb from "@tool-db/indexeddb-store";
import ToolDbWebrtc from "@tool-db/webrtc-network";
import { ToolDb } from "tool-db";

import addKeyListener from "./addKeyListener";
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
import reduxAction from "./reduxAction";
import setPassword from "./setPassword";
import signup from "./signup";

// Initialize ToolDb with the new plugin-based architecture
const toolDb = new ToolDb({
  topic: "mtgatool-db-swarm-v4",
  // debug: true,
  peers: [],
  debug: true,
  userAdapter: ToolDbEcdsaUser,
  networkAdapter: ToolDbWebrtc as any,
  storageAdapter: ToolDbIndexedb as any,
});

toolDb.on("init", (key) => console.warn("ToolDb initialized!", key));

// Wait for database to be ready
toolDb.ready.catch((err) => {
  console.error("Failed to initialize ToolDb:", err);
});

toolDb.onConnect = () => {
  reduxAction("SET_OFFLINE", false);
  self.postMessage({ type: "CONNECTED" });
};

toolDb.onDisconnect = () => {
  reduxAction("SET_OFFLINE", true);
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
      keysLogin(e.data.keys);
      break;

    case "SET_PASSWORD":
      setPassword(e.data.password);
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
      getCrdt(
        e.data.id,
        e.data.key,
        e.data.crdt,
        e.data.userNamespaced,
        e.data.timeoutMs
      );
      break;

    case "GET_LOCAL_DATA":
      getDataLocal(e.data.id, e.data.key);
      break;

    case "QUERY_KEYS":
      queryKeys(e.data.id, e.data.key, e.data.userNamespaced, e.data.timeoutMs);
      break;

    case "ADD_KEY_LISTENER":
      addKeyListener(e.data.id, e.data.key);
      break;

    case "SUBSCRIBE":
      self.toolDb.subscribeData(e.data.key, e.data.userNamespaced);
      break;

    case "REMOVE_KEY_LISTENER":
      self.toolDb.removeKeyListener(e.data.id);
      break;

    case "DO_FUNCTION":
      doFunction(e.data.id, e.data.fname, e.data.args, e.data.timeoutMs);
      break;

    case "GET_CONNECTION_DATA":
      getConnectionData();
      break;

    // Network operations are no longer manually controlled in the new P2P architecture
    // The webrtc-network adapter handles peer discovery automatically via WebRTC trackers
    case "CONNECT":
    case "DISCONNECT":
    case "REMOVE_HOST":
    case "FIND_SERVER":
      // These operations are no longer needed with P2P WebRTC
      console.log(
        `Network operation ${type} is handled automatically by webrtc-network`
      );
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
      if (self.toolDb.userAccount?.getAddress()) {
        self.toolDb
          .queryKeys(
            `:${self.toolDb.userAccount.getAddress()}.matches-`,
            false,
            5000
          )
          .then(handleMatchesIndex);
      }
      break;

    default:
      break;
  }
};
