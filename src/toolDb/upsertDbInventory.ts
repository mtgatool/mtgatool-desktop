import { DbInventoryInfo, DbUUIDData } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";

export default async function upsertDbInventory(
  inventory: Partial<DbInventoryInfo>
) {
  console.log("> Upsert inventory", inventory);

  const uuid = getLocalSetting("playerId") || "default";

  return window.toolDb
    .getData<DbUUIDData>(`${uuid}.data`, true)
    .then((uuidData) => {
      if (uuidData) {
        const newData = {
          ...uuidData,
          ...inventory,
          updated: new Date().getTime(),
        };

        window.toolDb.putData<DbUUIDData>(`${uuid}.data`, newData, true);
      }
    });
}
