"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RANK_MYTHIC = exports.RANK_DIAMOND = exports.RANK_PLATINUM = exports.RANK_GOLD = exports.RANK_SILVER = exports.RANK_BRONZE = void 0;
exports.RANK_BRONZE = 1;
exports.RANK_SILVER = 2;
exports.RANK_GOLD = 4;
exports.RANK_PLATINUM = 8;
exports.RANK_DIAMOND = 16;
exports.RANK_MYTHIC = 32;
function getRankFilterVal(rank) {
    let ret = 0;
    switch (rank) {
        case "Unranked":
            ret = 0;
            break;
        case "Bronze":
            ret = exports.RANK_BRONZE;
            break;
        case "Silver":
            ret = exports.RANK_SILVER;
            break;
        case "Gold":
            ret = exports.RANK_GOLD;
            break;
        case "Platinum":
            ret = exports.RANK_PLATINUM;
            break;
        case "Diamond":
            ret = exports.RANK_DIAMOND;
            break;
        case "Mythic":
            ret = exports.RANK_MYTHIC;
            break;
        default:
            break;
    }
    return ret;
}
exports.default = getRankFilterVal;
