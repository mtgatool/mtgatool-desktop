import { GraphEntryValue } from "tool-db/dist/types/graph";
import { DbliveDraftV1 } from "../types/dbTypes";

export default function liveDraftVerification(
  msg: GraphEntryValue<DbliveDraftV1>
): Promise<boolean> {
  return new Promise((resolve) => {
    window.toolDb
      .getData<DbliveDraftV1>(msg.key)
      .then((originalDraft) => {
        if (originalDraft) {
          if (originalDraft.owner === msg.pub) {
            // Check if we own this
            resolve(true);
          } else if (
            // Check if the owner data was not modified
            msg.value.owner !== originalDraft.owner ||
            msg.value.ref !== originalDraft.ref
          ) {
            resolve(false);
          } else if (
            msg.pub !== msg.value.owner &&
            Object.keys(msg.value.currentVotes).length <
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
