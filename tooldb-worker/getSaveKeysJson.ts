/* eslint-disable no-restricted-globals */

import { ParsedKeys } from "./keysLogin";

export default async function getSaveKeysJson(): Promise<{
  keys: ParsedKeys;
  userName: string;
} | null> {
  const userAccount = self.toolDb.userAccount as any;

  if (!userAccount) {
    return null;
  }

  try {
    // Get the public key (address) from the account
    const address = userAccount.getAddress?.();
    const username = userAccount.getUsername?.() || "";

    if (!address) {
      return null;
    }

    // In the new architecture, we can't directly access the raw keys
    // The userAccount adapter encapsulates them. We need to export them
    // through the encryptAccount method or implement a getKeys method.
    // For now, we'll export what we can.

    // Try to get the internal _keys if available (ecdsa-user specific)
    const keys = (userAccount as any)._keys as CryptoKeyPair | undefined;

    if (keys && keys.publicKey && keys.privateKey) {
      // Export the keys to spki/pkcs8 format
      const spkiBuffer = await crypto.subtle.exportKey("spki", keys.publicKey);
      const pkcs8Buffer = await crypto.subtle.exportKey("pkcs8", keys.privateKey);

      // Convert to base64
      const skpub = btoa(String.fromCharCode(...new Uint8Array(spkiBuffer)));
      const skpriv = btoa(String.fromCharCode(...new Uint8Array(pkcs8Buffer)));

      const parsedKeys: ParsedKeys = {
        skpub,
        skpriv,
        ekpub: "", // Not used in new architecture
        ekpriv: "", // Not used in new architecture
      };

      const saveKeys = { keys: parsedKeys, userName: username };
      self.postMessage({ type: `SAVE_KEYS_JSON`, value: saveKeys });
      return saveKeys;
    }

    return null;
  } catch (err) {
    console.error("Error getting save keys JSON:", err);
    return null;
  }
}
