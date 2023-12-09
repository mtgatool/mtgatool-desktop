/* eslint-disable no-restricted-globals */
import {
  encodeKeyString,
  exportKey,
  loadKeysComb,
  ParsedKeys,
} from "mtgatool-db";

import afterLogin from "./afterLogin";
import reduxAction from "./reduxAction";

export default function keysLogin(keys: ParsedKeys): Promise<void> {
  return new Promise((resolve, reject) => {
    loadKeysComb(keys).then((importedKeys) => {
      if (importedKeys) {
        exportKey("spki", importedKeys.signKeys.publicKey as CryptoKey)
          .then((skpub) => encodeKeyString(skpub as ArrayBuffer))
          .then((pubKey) => {
            console.log("keys", keys);
            console.log("pubKey", pubKey);

            self.toolDb
              .getData<string>(`:${pubKey}.username`, false, 5000)
              .then((username) => {
                console.log("username", username);
                self.toolDb
                  .keysSignIn(importedKeys, username || "")
                  .then(() => {
                    self.postMessage({ type: "LOGIN_OK" });
                    reduxAction("SET_PUBKEY", pubKey);
                    reduxAction("SET_MY_USERNAME", username);
                    afterLogin();
                    resolve();
                  });
              });
          });
      } else {
        reject(new Error("Something went wrong when importing the keys"));
      }
    });
  });
}
