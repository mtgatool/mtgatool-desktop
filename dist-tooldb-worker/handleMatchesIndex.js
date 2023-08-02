"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-restricted-globals */
const reduxAction_1 = __importDefault(require("./reduxAction"));
function handleMatchesIndex(matchesIndex) {
    self.globalData.matchesIndex = [
        ...new Set([...self.globalData.matchesIndex, ...(matchesIndex || [])]),
    ];
    console.log("handleMatchesIndex", self.globalData.matchesIndex);
    // Fetch any match we dont have locally
    self.globalData.matchesIndex.forEach((id) => {
        self.toolDb.store.get(id, (err, data) => {
            if (!data) {
                self.toolDb.getData(id, false, 2000);
            }
        });
    });
    (0, reduxAction_1.default)("SET_MATCHES_INDEX", self.globalData.matchesIndex);
}
exports.default = handleMatchesIndex;
