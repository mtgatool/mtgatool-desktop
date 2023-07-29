"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function findSetByCode(code, setNames, sets) {
    const name = setNames[code];
    return name ? sets[name] : undefined;
}
exports.default = findSetByCode;
