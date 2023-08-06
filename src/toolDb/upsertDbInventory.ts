import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import {
  DbInventoryData,
  DbInventoryInfo,
  defaultInventoryData,
} from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";
import { getLocalData } from "./worker-wrapper";

export default async function upsertDbInventory(
  inventory: Partial<DbInventoryInfo>
) {
  console.log("> Upsert inventory", inventory);

  const uuid = getLocalSetting("playerId") || "default";
  const { dispatch } = store;

  getLocalData(window.toolDb.getUserNamespacedKey(`${uuid}-inventory`)).then(
    (uuidData) => {
      if (uuidData) {
        const newData: DbInventoryData = {
          ...(uuidData as DbInventoryData),
          ...inventory,
          updated: new Date().getTime(),
        };

        reduxAction(dispatch, {
          type: "SET_UUID_INVENTORY_DATA",
          arg: { inventory: newData, uuid },
        });

        window.toolDb.putData<DbInventoryData>(
          `${uuid}-inventory`,
          newData,
          true
        );
      } else {
        window.toolDb.putData<DbInventoryData>(
          `${uuid}-inventory`,
          {
            ...defaultInventoryData,
            updated: new Date().getTime(),
          },
          true
        );
      }
    }
  );
}
