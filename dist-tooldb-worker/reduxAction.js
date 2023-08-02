"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-restricted-globals */
function reduxAction(type, arg) {
    self.postMessage({ type: "REDUX_ACTION", arg: { type, arg } });
}
exports.default = reduxAction;
