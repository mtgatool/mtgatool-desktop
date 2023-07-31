"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const reduxAction_1 = __importDefault(require("./reduxAction"));
function handleMatchesIndex(matchesIndex) {
    window.globalData.matchesIndex = [
        ...new Set([...window.globalData.matchesIndex, ...(matchesIndex || [])]),
    ];
    console.log("handleMatchesIndex", window.globalData.matchesIndex);
    // Fetch any match we dont have locally
    window.globalData.matchesIndex.forEach((id) => {
        window.toolDb.store.get(id, (err, data) => {
            if (!data) {
                window.toolDb.getData(id, false, 2000);
            }
        });
    });
    (0, reduxAction_1.default)("SET_MATCHES_INDEX", window.globalData.matchesIndex);
}
exports.default = handleMatchesIndex;
