// eslint-disable-next-line import/no-unresolved
import { decryptWithPass } from "@tool-db/ecdsa-user";
import { base64ToUint8, proofOfWork } from "tool-db";

import { UserRootData } from "../../tooldb-worker/setPassword";
import { UserRecoveryData } from "../types/dbTypes";
import { getData } from "./worker-wrapper";

/**
 * Check passphrase for account recovery
 * @param username - The username to recover
 * @param passphrase - The recovery passphrase (12 words)
 * @returns Promise resolving to the decrypted reminder/password hint
 */
export default function checkPassphrase(username: string, passphrase: string) {
  return getData<UserRootData>(`==${username}`).then((userData) => {
    // Get the public key from user data
    const pubKey = userData?.keys.skpub || userData?.keys.skpriv;
    if (!pubKey) {
      return Promise.reject(new Error("Could not find user data"));
    }

    return getData<UserRecoveryData>(`:${pubKey}.recovery`, false, 5000).then(
      (rec) => {
        if (rec) {
          const { recovery, iv } = rec;
          // Generate the decryption key from passphrase using proof of work
          return proofOfWork(passphrase, 3).then(
            ({ hash }: { hash: string }) => {
              // Decrypt the recovery data
              // The recovery data is hex-encoded encrypted text
              const ivBytes = base64ToUint8(iv);
              return decryptWithPass(recovery, hash, ivBytes);
            }
          );
        }
        return Promise.reject(new Error("Could not find recovery data"));
      }
    );
  });
}
