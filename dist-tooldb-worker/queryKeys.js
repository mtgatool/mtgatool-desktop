"use strict";
/* eslint-disable no-restricted-globals */
Object.defineProperty(exports, "__esModule", { value: true });
function queryKeys(msgId, key, userNamespaced, timeoutMs = 5000) {
    return self.toolDb
        .queryKeys(key, userNamespaced, timeoutMs)
        .then((value) => {
        self.postMessage({ type: `${msgId}_OK`, value });
    })
        .catch((err) => {
        self.postMessage({ type: `${msgId}_ERR`, err });
    });
}
exports.default = queryKeys;
