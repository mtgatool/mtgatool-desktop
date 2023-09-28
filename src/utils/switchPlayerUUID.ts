import _ from "lodash";

import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import upsertDbDisplayName from "../toolDb/upsertDbDisplayName";
import upsertDbUserdata from "../toolDb/upsertDbuserdata";
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
  }
}
