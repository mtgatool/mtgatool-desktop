"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getWinrateValue(wins, losses) {
    return wins + losses == 0 ? -1 : Math.round((100 / (wins + losses)) * wins);
}
exports.default = getWinrateValue;
