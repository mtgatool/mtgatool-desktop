"use strict";
/* eslint-disable no-restricted-globals */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mtgatool_db_1 = require("mtgatool-db");
const constants_1 = require("./constants");
const login_1 = __importDefault(require("./login"));
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
    toolDb.onConnect = () => {
        window.postMessage({ type: "CONNECTED" });
    };
};
window.toolDb = toolDb;
self.onmessage = (e) => {
    const { type } = e.data;
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
        default:
            break;
    }
};
