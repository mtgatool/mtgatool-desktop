"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mtgatool_db_1 = require("mtgatool-db");
const afterLogin_1 = __importDefault(require("./afterLogin"));
function keysLogin(username, keys) {
    return new Promise((resolve, reject) => {
        window.toolDb
            .getData(`==${username}`, false, 5000)
            .then((user) => {
            if (user) {
                (0, mtgatool_db_1.loadKeysComb)(keys).then((importedKeys) => {
                    if (importedKeys) {
                        (0, mtgatool_db_1.exportKey)("spki", importedKeys.signKeys.publicKey)
                            .then((skpub) => (0, mtgatool_db_1.encodeKeyString)(skpub))
                            .then((pubKey) => {
                            if (pubKey === user.keys.skpub) {
                                window.toolDb
                                    .keysSignIn(importedKeys, username)
                                    .then(() => {
                                    (0, afterLogin_1.default)();
                                    resolve();
                                });
                            }
                            else {
                                reject(new Error("Public key does not match!"));
                            }
                        });
                    }
                    else {
                        reject(new Error("Something went wrong when importing the keys"));
                    }
                });
            }
            else {
                reject(new Error("Could not find user to validate"));
            }
        });
    });
}
exports.default = keysLogin;
