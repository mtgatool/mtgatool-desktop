"use strict";
/* eslint-disable no-restricted-globals */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mtgatool_db_1 = require("mtgatool-db");
const constants_1 = require("./constants");
const doFunction_1 = __importDefault(require("./doFunction"));
const exploreAggregation_1 = require("./exploreAggregation");
const getData_1 = __importDefault(require("./getData"));
const getDataLocal_1 = __importDefault(require("./getDataLocal"));
const login_1 = __importDefault(require("./login"));
const queryKeys_1 = __importDefault(require("./queryKeys"));
const signup_1 = __importDefault(require("./signup"));
const toolDb = new mtgatool_db_1.ToolDb({
    topic: "mtgatool-db-swarm-v4",
    debug: true,
    server: false,
});
toolDb.on("init", (key) => console.warn("ToolDb initialized!", key));
constants_1.DEFAULT_PEERS.forEach((peer) => {
    const networkModule = toolDb.network;
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
self.onmessage = (e) => {
    const { type } = e.data;
    console.log("Worker onmessage", e.data.type, e.data);
    switch (type) {
        case "LOGIN":
            (0, login_1.default)(e.data.username, e.data.password);
            break;
        case "KEYS_LOGIN":
            (0, login_1.default)(e.data.username, e.data.keys);
            break;
        case "SIGNUP":
            (0, signup_1.default)(e.data.username, e.data.password);
            break;
        case "PUT_DATA":
            self.toolDb.putData(e.data.key, e.data.data, e.data.userNamespaced);
            break;
        case "GET_DATA":
            (0, getData_1.default)(e.data.id, e.data.key, e.data.userNamespaced, e.data.timeoutMs);
            break;
        case "GET_LOCAL_DATA":
            (0, getDataLocal_1.default)(e.data.id, e.data.key);
            break;
        case "QUERY_KEYS":
            (0, queryKeys_1.default)(e.data.id, e.data.key, e.data.userNamespaced, e.data.timeoutMs);
            break;
        case "DO_FUNCTION":
            (0, doFunction_1.default)(e.data.id, e.data.fname, e.data.args);
            break;
        // application specific handlers
        case "EXPLORE_DATA_QUERY":
            (0, exploreAggregation_1.beginDataQuery)(e.data.days, e.data.event);
            break;
        default:
            break;
    }
};
