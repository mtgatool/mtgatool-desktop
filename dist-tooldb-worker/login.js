"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const afterLogin_1 = __importDefault(require("./afterLogin"));
function login(username, password) {
    return window.toolDb
        .signIn(username, password)
        .then((keys) => {
        window.toolDb.putData("username", username, true);
        (0, afterLogin_1.default)();
        window.postMessage({ type: "LOGIN_OK" });
        return keys;
    })
        .catch((err) => {
        window.postMessage({ type: "LOGIN_ERR", err });
    });
}
exports.default = login;
