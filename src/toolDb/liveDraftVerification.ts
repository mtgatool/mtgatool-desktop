import { VerificationData } from "mtgatool-db";

import { DbliveDraftV1 } from "../types/dbTypes";
import { getData } from "./worker-wrapper";

export default function liveDraftVerification(
  msg: VerificationData<DbliveDraftV1>
): Promise<boolean> {
  return new Promise((resolve) => {
    getData<DbliveDraftV1>(msg.k)
      .then((originalDraft) => {
        if (originalDraft) {
          if (originalDraft.owner === msg.p) {
            // Check if we own this
            // the owner has full control so we simply allow his writes
            resolve(true);
          } else if (
            // Check if the owner data was not modified
            msg.v.owner !== originalDraft.owner ||
            msg.v.ref !== originalDraft.ref
          ) {
            resolve(false);
          } else if (
            Object.keys(msg.v.votes).length <
            Object.keys(originalDraft.votes).length
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
