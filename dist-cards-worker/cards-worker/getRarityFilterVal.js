"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getRarityFilterVal(rarity) {
    let ret = 0;
    switch (rarity) {
        case "token":
            ret = 1;
            break;
        case "land":
            ret = 2;
            break;
        case "common":
            ret = 4;
            break;
        case "uncommon":
            ret = 8;
            break;
        case "rare":
            ret = 16;
            break;
        case "mythic":
            ret = 32;
            break;
        default:
            ret = 0;
            break;
    }
    return ret;
}
exports.default = getRarityFilterVal;
