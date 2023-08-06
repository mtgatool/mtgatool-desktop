/* eslint-disable no-restricted-globals */
import {
  encodeKeyString,
  exportKey,
  loadKeysComb,
  ParsedKeys,
  UserRootData,
} from "mtgatool-db";

import afterLogin from "./afterLogin";

export default function keysLogin(
  username: string,
  keys: ParsedKeys
): Promise<void> {
  return new Promise((resolve, reject) => {
    self.toolDb
      .getData<UserRootData>(`==${username}`, false, 5000)
      .then((user) => {
        if (user) {
          loadKeysComb(keys).then((importedKeys) => {
            if (importedKeys) {
              exportKey("spki", importedKeys.signKeys.publicKey as CryptoKey)
                .then((skpub) => encodeKeyString(skpub as ArrayBuffer))
                .then((pubKey) => {
                  if (pubKey === user.keys.skpub) {
                    self.toolDb.keysSignIn(importedKeys, username).then(() => {
                      afterLogin();
                      resolve();
                    });
                  } else {
                    reject(new Error("Public key does not match!"));
                  }
                });
            } else {
              reject(new Error("Something went wrong when importing the keys"));
            }
          });
        } else {
          reject(new Error("Could not find user to validate"));
        }
      });
  });
}