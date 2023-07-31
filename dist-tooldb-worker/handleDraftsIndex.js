"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const reduxAction_1 = __importDefault(require("./reduxAction"));
function handleDraftsIndex(draftsIndex) {
    window.globalData.draftsIndex = [
        ...new Set([...window.globalData.draftsIndex, ...(draftsIndex || [])]),
    ];
    console.log("handleDraftsIndex", window.globalData.draftsIndex);
    // Fetch any match we dont have locally
    window.globalData.draftsIndex.forEach((id) => {
        window.toolDb.store.get(id, (err, data) => {
            if (!data) {
                window.toolDb.getData(id, false, 2000);
            }
        });
    });
    (0, reduxAction_1.default)("SET_DRAFTS_INDEX", window.globalData.draftsIndex);
}
exports.default = handleDraftsIndex;
