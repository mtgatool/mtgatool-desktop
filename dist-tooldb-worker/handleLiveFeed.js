"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const automerge_1 = __importDefault(require("automerge"));
const mtgatool_db_1 = require("mtgatool-db");
const reduxAction_1 = __importDefault(require("./reduxAction"));
function handleLiveFeed(msg) {
    // console.log("Key Listener live feed ", msg);
    if (msg && msg.type === "crdt") {
        if (window.globalData.liveFeed) {
            const doc = automerge_1.default.load((0, mtgatool_db_1.base64ToBinaryDocument)(msg.doc));
            try {
                window.globalData.liveFeed = automerge_1.default.merge(automerge_1.default.init(), doc);
            }
            catch (e) {
                console.warn(e);
            }
            const filteredLiveFeed = Object.keys(window.globalData.liveFeed)
                .sort((a, b) => {
                if (window.globalData.liveFeed[a] > window.globalData.liveFeed[b])
                    return -1;
                if (window.globalData.liveFeed[a] < window.globalData.liveFeed[b])
                    return 1;
                return 0;
            })
                .slice(0, 10);
            (0, reduxAction_1.default)("SET_LIVE_FEED", filteredLiveFeed);
            // Fetch any match we dont have locally
            filteredLiveFeed.forEach((id) => {
                window.toolDb.store.get(id, (err, data) => {
                    if (!data) {
                        window.toolDb.getData(id, false).then((match) => {
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
