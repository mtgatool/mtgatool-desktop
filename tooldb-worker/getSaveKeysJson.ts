/* eslint-disable no-restricted-globals */

import { ParsedKeys, saveKeysComb } from "mtgatool-db";

export default function getSaveKeysJson(): Promise<{
  keys: ParsedKeys;
  userName: string;
} | null> {
  return new Promise((resolve) => {
    if (self.toolDb.user) {
      saveKeysComb(
        self.toolDb.user.keys.signKeys,
        self.toolDb.user.keys.encryptionKeys
      ).then((keys) => {
        const saveKeys = { keys: keys, userName: self.toolDb.user?.name || "" };
        self.postMessage({ type: `SAVE_KEYS_JSON`, value: saveKeys });
        resolve(saveKeys);
      });
    } else {
      resolve(null);
    }
  });
}
