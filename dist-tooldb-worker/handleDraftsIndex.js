"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-restricted-globals */
const reduxAction_1 = __importDefault(require("./reduxAction"));
function handleDraftsIndex(draftsIndex) {
    self.globalData.draftsIndex = [
        ...new Set([...self.globalData.draftsIndex, ...(draftsIndex || [])]),
    ];
    console.log("handleDraftsIndex", self.globalData.draftsIndex);
    // Fetch any match we dont have locally
    self.globalData.draftsIndex.forEach((id) => {
        self.toolDb.store.get(id, (err, data) => {
            if (!data) {
                self.toolDb.getData(id, false, 2000);
            }
        });
    });
    (0, reduxAction_1.default)("SET_DRAFTS_INDEX", self.globalData.draftsIndex);
}
exports.default = handleDraftsIndex;
