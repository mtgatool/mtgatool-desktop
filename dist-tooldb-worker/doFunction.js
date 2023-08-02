"use strict";
/* eslint-disable no-restricted-globals */
Object.defineProperty(exports, "__esModule", { value: true });
function doFunction(msgId, fname, args) {
    return self.toolDb
        .doFunction(fname, args)
        .then((value) => {
        self.postMessage({ type: `${msgId}_OK`, value });
    })
        .catch((err) => {
        self.postMessage({ type: "LOGIN_ERR", err });
    });
}
exports.default = doFunction;
