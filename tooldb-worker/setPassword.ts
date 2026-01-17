/* eslint-disable no-restricted-globals */

import { sha256, uint8ToBase64 } from "tool-db";
import { generateIv } from "@tool-db/ecdsa-user";

// UserRootData structure for storing encrypted keys
export interface UserRootData {
  keys: {
    skpub: string;
    skpriv: string;
    ekpub: string;
    ekpriv: string;
  };
  iv: string;
  pass: string;
}

export default async function setPassword(password: string) {
  const userAccount = self.toolDb.userAccount as any;
  if (!userAccount) return;

  try {
    // Encrypt the account with the new password
    const encrypted = await userAccount.encryptAccount(password);
    if (!encrypted) {
      console.log("Error encrypting account");
      return;
    }

    // Get username
    const username = userAccount.getUsername?.() || "";

    // In the new tool-db, the encrypted account structure is different
    // It's stored as EncryptedUserdata: { name, keys (encrypted string), iv }
    // We need to store this in the database
    const iv = generateIv();

    const userData: UserRootData = {
      keys: {
        // In new architecture, keys are already encrypted in the 'keys' field
        skpub: "", // Not separately stored anymore
        skpriv: encrypted.keys || "",
        ekpub: "",
        ekpriv: "",
      },
      iv: encrypted.iv || uint8ToBase64(iv),
      pass: sha256(password),
    };

    self.toolDb.putData(`==${username}`, userData, false);
  } catch (err) {
    console.log("Error setting password", err);
  }
}
