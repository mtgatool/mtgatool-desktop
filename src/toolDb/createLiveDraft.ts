/* eslint-disable no-param-reassign */
import Automerge from "automerge";
import { InternalDraftv2 } from "mtgatool-shared";
import { base64ToBinaryDocument } from "mtgatool-db";
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import { DbliveDraftV1 } from "../types/dbTypes";

export default function createLiveDraft(draft: InternalDraftv2): null | string {
  if (window.toolDb.user) {
    const key = `live-draft-v1-${draft.id}`;

    const origDoc = Automerge.init<DbliveDraftV1>();

    const newDoc = Automerge.change(origDoc, (doc) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      doc.owner = window.toolDb.user?.pubKey || "";
      doc.ref = window.toolDb.getUserNamespacedKey(`draft-${draft.id}`);
      doc.votes = {};
    });

    window.toolDb.putCrdt<DbliveDraftV1>(
      key,
      Automerge.getChanges(origDoc, newDoc),
      false
    );

    window.toolDb.addKeyListener<DbliveDraftV1>(key, (msg) => {
      if (msg.type === "crdt") {
        const doc = Automerge.load<DbliveDraftV1>(
          base64ToBinaryDocument(msg.doc)
        );
        const _newDoc = Automerge.merge<DbliveDraftV1>(Automerge.init(), doc);
        console.log("Recieved update", doc);

        postChannelMessage({
          type: "DRAFT_VOTES",
          value: _newDoc.votes,
        });
      }
    });

    window.toolDb.subscribeData(key);

    return key;
  }
  return null;
}
