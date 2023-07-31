"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const login_1 = __importDefault(require("./login"));
function waitMs(ms) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(true), ms);
    });
}
/**
 * Sign up process
 * @param username plaintext username
 * @param password sha1 of the plaintext password
 * @returns Promise<PutMessage>
 */
function signup(username, password) {
    return window.toolDb
        .signUp(username, password)
        .then((msg) => {
        // console.log("Sent signup! now wait");
        return waitMs(3000).then(() => {
            // console.log("wait finished, now login");
            return (0, login_1.default)(username, password).then((_keys) => {
                // console.log("login ok!?");
                return window.toolDb
                    .putData("userids", {}, true)
                    .then((_put) => {
                    return msg;
                });
            });
        });
    })
        .catch((err) => {
        window.postMessage({ type: "SIGNUP_ERR", err });
    });
}
exports.default = signup;
