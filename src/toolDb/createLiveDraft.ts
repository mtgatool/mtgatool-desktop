/* eslint-disable no-param-reassign */
import { VerificationData } from "tool-db";

import postChannelMessage from "../broadcastChannel/postChannelMessage";
import { LOGIN_OK } from "../constants";
import store from "../redux/stores/rendererStore";
import { InternalDraftv2 } from "../types";
import { DbliveDraftV1 } from "../types/dbTypes";
import getUserNamespacedKey from "./getUserNamespacedKey";

export default function createLiveDraft(draft: InternalDraftv2): null | string {
  const { pubKey, loginState } = store.getState().renderer;
  if (loginState === LOGIN_OK) {
    const key = `live-draft-v1-${draft.id}`;

    // Create initial live draft data (no Automerge in new architecture)
    const liveDraftData: DbliveDraftV1 = {
      owner: pubKey || "",
      ref: getUserNamespacedKey(pubKey, `draft-${draft.id}`),
      votes: {},
    };

    // Put the initial data
    window.toolDb.putData<DbliveDraftV1>(key, liveDraftData, false);

    // Set up a listener for updates
    window.toolDb.addKeyListener<DbliveDraftV1>(
      key,
      (msg: VerificationData<DbliveDraftV1>) => {
        if (msg.v) {
          console.log("Received update", msg.v);

          postChannelMessage({
            type: "DRAFT_VOTES",
            value: msg.v.votes,
          });
        }
      }
    );

    window.toolDb.subscribeData(key);

    return key;
  }
  return null;
}
