import { InternalDraftv2 } from "mtgatool-shared";
import { DbliveDraftV1 } from "../types/dbTypes";

export default async function createLiveDraft(draft: InternalDraftv2) {
  if (window.toolDb.user) {
    const newLiveDraft: DbliveDraftV1 = {
      owner: window.toolDb.user.pubKey,
      ref: window.toolDb.getUserNamespacedKey(`${draft.id}`),
      currentVotes: {},
    };

    window.toolDb.putData<DbliveDraftV1>(
      `livedraft-v1-${draft.id}`,
      newLiveDraft
    );
  }
}
