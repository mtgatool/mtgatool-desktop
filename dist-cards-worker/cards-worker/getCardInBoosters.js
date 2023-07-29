"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const findSetByCode_1 = __importDefault(require("./findSetByCode"));
function getCardInBoosters(card, setNames, sets) {
    const set = (0, findSetByCode_1.default)(card.DigitalSet === null || card.DigitalSet === ""
        ? card.Set
        : card.DigitalSet, setNames, sets);
    if (card.IsToken)
        return false;
    if ((set === null || set === void 0 ? void 0 : set.collation) === -1)
        return false;
    if (card.LinkedFaceType === 11) {
        return false;
    }
    if (!card.IsPrimaryCard) {
        return false;
    }
    return true;
}
exports.default = getCardInBoosters;
