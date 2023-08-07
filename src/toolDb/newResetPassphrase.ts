import {
  encryptWithPass,
  generateIv,
  proofOfWork,
  toBase64,
  uint8ToBase64,
} from "mtgatool-db";
import randomWords from "random-words";

import { UserRecoveryData } from "../types/dbTypes";
import { putData } from "./worker-wrapper";

export default function newResetPassphrase(reminder: string) {
  const passphrase = randomWords({
    exactly: 12,
    maxLength: 6,
    join: " ",
    formatter: (word) => word.toUpperCase(),
  });

  const iv = generateIv();
  return proofOfWork(passphrase, 3).then(({ hash }) =>
    encryptWithPass(reminder, hash, iv).then((encrypted) => {
      putData<UserRecoveryData>(
        "recovery",
        {
          recovery: toBase64(encrypted || ""),
          iv: uint8ToBase64(iv),
        },
        true
      );

      return passphrase;
    })
  );
}
