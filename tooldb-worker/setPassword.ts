/* eslint-disable no-restricted-globals */

import {
  encryptWithPass,
  generateIv,
  saveKeysComb,
  sha256,
  toBase64,
  uint8ToBase64,
  UserRootData,
} from "mtgatool-db";

export default function setPassword(password: string) {
  if (!self.toolDb.user) return;

  saveKeysComb(
    self.toolDb.user.keys.signKeys,
    self.toolDb.user.keys.encryptionKeys
  )
    .then((savedKeys) => {
      const iv = generateIv();
      let encskpriv = "";
      let encekpriv = "";

      // Encrypt keys with new password
      encryptWithPass(savedKeys.skpriv, password, iv)
        .then((skenc) => {
          encryptWithPass(savedKeys.ekpriv, password, iv)
            .then((ekenc) => {
              if (skenc) encskpriv = skenc;
              if (ekenc) encekpriv = ekenc;

              const userData: UserRootData = {
                keys: {
                  skpub: savedKeys.skpub,
                  skpriv: toBase64(encskpriv),
                  ekpub: savedKeys.ekpub,
                  ekpriv: toBase64(encekpriv),
                },
                iv: uint8ToBase64(iv),
                pass: sha256(password),
              };

              self.toolDb.putData(
                `==${self.toolDb.user?.name}`,
                userData,
                false
              );
            })
            .catch((err) => {
              console.log("Error encrypting ekpriv", err);
            });
        })
        .catch((err) => {
          console.log("Error encrypting skpriv", err);
        });
    })
    .catch((err) => {
      console.log("Error loading saved keys", err);
    });
}
