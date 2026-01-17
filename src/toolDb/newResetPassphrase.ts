// eslint-disable-next-line import/no-unresolved
import { encryptWithPass, generateIv } from "@tool-db/ecdsa-user";
import randomWords from "random-words";
import { proofOfWork, uint8ToBase64 } from "tool-db";

import { UserRecoveryData } from "../types/dbTypes";
import { putData } from "./worker-wrapper";

/**
 * Generate a new recovery passphrase and store encrypted reminder
 * @param reminder - The password hint/reminder to encrypt and store
 * @returns The 12-word recovery passphrase
 */
export default function newResetPassphrase(reminder: string) {
  const passphrase = randomWords({
    exactly: 12,
    maxLength: 6,
    join: " ",
    formatter: (word: string) => word.toUpperCase(),
  });

  const iv = generateIv();

  // Generate encryption key from passphrase using proof of work
  return proofOfWork(passphrase, 3).then(({ hash }: { hash: string }) => {
    // Encrypt the reminder with the passphrase-derived key
    return encryptWithPass(reminder, hash, iv).then((encrypted) => {
      // Store the encrypted recovery data
      putData<UserRecoveryData>(
        "recovery",
        {
          recovery: encrypted || "",
          iv: uint8ToBase64(iv),
        },
        true
      );

      return passphrase;
    });
  });
}
