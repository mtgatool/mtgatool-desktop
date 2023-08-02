"use strict";
/* eslint-disable no-restricted-globals */
Object.defineProperty(exports, "__esModule", { value: true });
function getData(msgId, key, userNamespaced, timeoutMs = 5000) {
    return self.toolDb
        .getData(key, userNamespaced, timeoutMs)
        .then((value) => {
        self.postMessage({ type: `${msgId}_OK`, value });
    })
        .catch((err) => {
        self.postMessage({ type: "LOGIN_ERR", err });
    });
}
exports.default = getData;
