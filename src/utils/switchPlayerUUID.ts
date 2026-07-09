import _ from "lodash";

import { ensureArenaAccount } from "../data/cloudSync";
import upsertDbDisplayName from "../data/upsertDbDisplayName";
import upsertDbUserdata from "../data/upsertDbUserdata";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import setLocalSetting from "./setLocalSetting";

export default async function switchPlayerUUID(
  uuid: string,
  displayName?: string
) {
  if (uuid && uuid !== "" && uuid !== "undefined") {
    setLocalSetting("playerId", uuid);
    const { dispatch, getState } = store;

    if (getState().mainData.currentUUID !== uuid) {
      reduxAction(dispatch, {
        type: "SET_UUID",
        arg: uuid,
      });

      upsertDbUserdata({ [uuid]: new Date().getTime() });
    }

    if (displayName) {
      upsertDbDisplayName(displayName, uuid);
    }

    // Link (or refresh) this MTGA account on the cloud. arena_accounts is the
    // FK parent of all synced data, so this must land before any push; it is a
    // no-op when signed in locally/offline.
    ensureArenaAccount(uuid, displayName);
  }
}
