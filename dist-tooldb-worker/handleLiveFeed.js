"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-restricted-globals */
const automerge_1 = __importDefault(require("automerge"));
const mtgatool_db_1 = require("mtgatool-db");
const reduxAction_1 = __importDefault(require("./reduxAction"));
function handleLiveFeed(msg) {
    // console.log("Key Listener live feed ", msg);
    if (msg && msg.type === "crdt") {
        if (self.globalData.liveFeed) {
            const doc = automerge_1.default.load((0, mtgatool_db_1.base64ToBinaryDocument)(msg.doc));
            try {
                self.globalData.liveFeed = automerge_1.default.merge(automerge_1.default.init(), doc);
            }
            catch (e) {
                console.warn(e);
            }
            const filteredLiveFeed = Object.keys(self.globalData.liveFeed)
                .sort((a, b) => {
                if (self.globalData.liveFeed[a] > self.globalData.liveFeed[b])
                    return -1;
                if (self.globalData.liveFeed[a] < self.globalData.liveFeed[b])
                    return 1;
                return 0;
            })
                .slice(0, 10);
            (0, reduxAction_1.default)("SET_LIVE_FEED", filteredLiveFeed);
            // Fetch any match we dont have locally
            filteredLiveFeed.forEach((id) => {
                self.toolDb.store.get(id, (err, data) => {
                    if (!data) {
                        self.toolDb.getData(id, false).then((match) => {
                            (0, reduxAction_1.default)("SET_LIVE_FEED_MATCH", { key: id, match: match });
                        });
                    }
                    else {
                        (0, reduxAction_1.default)("SET_LIVE_FEED_MATCH", {
                            key: id,
                            match: JSON.parse(data).v,
                        });
                    }
                });
            });
        }
    }
}
exports.default = handleLiveFeed;
