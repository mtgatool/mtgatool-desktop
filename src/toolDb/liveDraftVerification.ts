import { VerificationData } from "tool-db";

import { DbliveDraftV1 } from "../types/dbTypes";

export default function liveDraftVerification(
  msg: VerificationData<DbliveDraftV1>
): Promise<boolean> {
  return new Promise((resolve) => {
    window.toolDb
      .getData<DbliveDraftV1>(msg.k)
      .then((originalDraft) => {
        if (originalDraft) {
          if (originalDraft.owner === msg.p) {
            // Check if we own this
            resolve(true);
          } else if (
            // Check if the owner data was not modified
            msg.v.owner !== originalDraft.owner ||
            msg.v.ref !== originalDraft.ref
          ) {
            resolve(false);
          } else if (
            msg.p !== msg.v.owner &&
            Object.keys(msg.v.currentVotes).length <
              Object.keys(originalDraft.currentVotes).length
          ) {
            // If it was not, check if we are not removing any entry
            resolve(false);
          } else {
            // All seems good!
            resolve(true);
          }
        } else {
          resolve(false);
        }
      })
      .catch(() => resolve(false));
  });
}
