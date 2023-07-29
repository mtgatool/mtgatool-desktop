"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const allFormats_1 = __importDefault(require("./allFormats"));
const findSetByCode_1 = __importDefault(require("./findSetByCode"));
function getCardFormats(card, allCards, setNames, sets) {
    const allowed = [];
    const arenaSetCode = [card.Set.toLowerCase()];
    if (card.DigitalSet) {
        arenaSetCode.push(card.DigitalSet.toLowerCase());
    }
    card.Reprints.forEach((cid) => {
        const reprint = allCards[cid];
        if (reprint) {
            const setObj = (0, findSetByCode_1.default)(reprint.DigitalSet === null || reprint.DigitalSet === ""
                ? reprint.Set
                : reprint.DigitalSet, setNames, sets);
            if (setObj) {
                arenaSetCode.push(setObj.arenacode);
            }
        }
    });
    Object.keys(allFormats_1.default).forEach((name) => {
        const format = allFormats_1.default[name];
        if (format.allowedTitleIds.includes(card.TitleId) ||
            format.sets.some((set) => arenaSetCode.indexOf(set.toLowerCase()) >= 0)) {
            if (name == "Pauper" || name == "HistoricPauper") {
                if (card.Rarity == "common") {
                    allowed.push(name);
                }
            }
            else {
                allowed.push(name);
            }
        }
    });
    return allowed;
}
exports.default = getCardFormats;
