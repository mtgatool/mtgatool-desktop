"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getCardFormats_1 = __importDefault(require("./getCardFormats"));
function getCardIsCraftable(card, cards, setNames, sets) {
    if (card.Rarity === "land" || !card.IsToken)
        return false;
    if (card.LinkedFaceType === 11) {
        return false;
    }
    const formats = (0, getCardFormats_1.default)(card, cards, setNames, sets);
    if (formats.includes("Standard") ||
        formats.includes("Historic") ||
        formats.includes("Alchemy") ||
        formats.includes("Explorer") ||
        formats.includes("Singleton")) {
        return true;
    }
    return false;
}
exports.default = getCardIsCraftable;
