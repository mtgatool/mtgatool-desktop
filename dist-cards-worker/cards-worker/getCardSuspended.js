"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const allFormats_1 = __importDefault(require("./allFormats"));
function getCardSuspended(card) {
    const suspended = [];
    Object.keys(allFormats_1.default).forEach((name) => {
        const format = allFormats_1.default[name];
        if (format.suspendedTitleIds.includes(card.TitleId)) {
            suspended.push(name);
        }
    });
    return suspended;
}
exports.default = getCardSuspended;
