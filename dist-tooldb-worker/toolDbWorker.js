"use strict";
/* eslint-disable no-restricted-globals */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PEERS = void 0;
const mtgatool_db_1 = require("mtgatool-db");
exports.DEFAULT_PEERS = [
    "ccdde0f639db3ccb18ed2d48ed405323eac3ce86762923c1010796433e9a392dec3771400f524d4f0a466c0701cad99bbd8b509df3a467c8ca76fab7dc5504bb",
];
const toolDb = new mtgatool_db_1.ToolDb({
    topic: "mtgatool-db-swarm-v4",
    server: false,
});
toolDb.on("init", (key) => console.warn("ToolDb initialized!", key));
exports.DEFAULT_PEERS.forEach((peer) => {
    const networkModule = toolDb.network;
    networkModule.findServer(peer);
});
toolDb.onConnect = () => {
    toolDb.onConnect = () => {
        //
    };
};
self.onmessage = (e) => {
    const { cards, cardsList, allCards, setNames, sets } = e.data;
};
