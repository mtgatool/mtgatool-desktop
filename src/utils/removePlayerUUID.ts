import _ from "lodash";

import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { getData, putData } from "../toolDb/worker-wrapper";
import { DbUserids } from "../types/dbTypes";

export default async function removePlayerUUID(uuid: string) {
  const { dispatch } = store;
  reduxAction(dispatch, {
    type: "REMOVE_UUID",
    arg: uuid,
  });

  getData<DbUserids>("userids", true).then((userids) => {
    if (userids) {
      const newData = _.omit(userids, uuid);

      putData<DbUserids>("userids", newData, true);
    }
  });
}
