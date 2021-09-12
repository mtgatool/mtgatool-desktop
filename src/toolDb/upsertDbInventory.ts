import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { DbInventoryInfo, DbUUIDData, defaultUUIDData } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";

export default async function upsertDbInventory(
  inventory: Partial<DbInventoryInfo>
) {
  console.log("> Upsert inventory", inventory);

  const uuid = getLocalSetting("playerId") || "default";
  const { dispatch } = store;

  return window.toolDb
    .getData<DbUUIDData>(`${uuid}-data`, true)
    .then((uuidData) => {
      if (uuidData) {
        const newData = {
          ...uuidData,
          inventory: { ...uuidData.inventory, ...inventory },
          updated: new Date().getTime(),
        };

        reduxAction(dispatch, {
          type: "SET_UUID_DATA",
          arg: { data: newData, uuid },
        });

        window.toolDb.putData<DbUUIDData>(`${uuid}-data`, newData, true);
      } else {
        window.toolDb.putData<DbUUIDData>(
          `${uuid}-data`,
          {
            ...defaultUUIDData,
            updated: new Date().getTime(),
          },
          true
        );
      }
    });
}
