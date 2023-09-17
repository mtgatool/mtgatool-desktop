import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { DbDisplayName } from "../types/dbTypes";
import { putData } from "./worker-wrapper";

export default async function upsertDbDisplayName(
  displayName: string,
  uuid: string
) {
  console.log("> Upsert displayName", displayName, uuid);

  const { dispatch } = store;

  reduxAction(dispatch, {
    type: "SET_UUID_DISPLAYNAME",
    arg: { displayName, uuid },
  });

  putData<DbDisplayName>(
    `${uuid}-displayname`,
    {
      displayName,
      updated: new Date().getTime(),
    },
    true
  );
}
