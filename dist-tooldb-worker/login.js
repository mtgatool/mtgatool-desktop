"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-restricted-globals */
const afterLogin_1 = __importDefault(require("./afterLogin"));
const reduxAction_1 = __importDefault(require("./reduxAction"));
function login(username, password) {
    return self.toolDb
        .signIn(username, password)
        .then((keys) => {
        var _a;
        self.toolDb.putData("username", username, true);
        (0, afterLogin_1.default)();
        self.postMessage({ type: "LOGIN_OK" });
        (0, reduxAction_1.default)("SET_PUBKEY", (_a = self.toolDb.user) === null || _a === void 0 ? void 0 : _a.pubKey);
        return keys;
    })
        .catch((err) => {
        self.postMessage({ type: "LOGIN_ERR", err });
    });
}
exports.default = login;
