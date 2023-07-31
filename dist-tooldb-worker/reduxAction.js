"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function reduxAction(type, arg) {
    window.postMessage({ type: "REDUX_ACTION", arg: { type, arg } });
}
exports.default = reduxAction;
