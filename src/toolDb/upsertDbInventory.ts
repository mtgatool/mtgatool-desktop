import { PlayerInventory } from "mtgatool-shared";
import { DbUUIDData } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";

export default async function upsertDbInventory(inventory: PlayerInventory) {
  const boosters: Record<string, number> = {};
  inventory.boosters.forEach((b) => {
    boosters[b.collationId] = b.count;
  });

  console.log("> Upsert inventory", inventory);

  const userId = getLocalSetting("playerId") || "default";

  return window.toolDb
    .getData<DbUUIDData>("uuidData", true)
    .then((uuidData) => {
      const newData = {
        ...uuidData,
        [userId]: {
          gold: inventory.gold,
          gems: inventory.gems,
          vaultProgress: inventory.vaultProgress,
          wcTrackPosition: inventory.wcTrackPosition,
          wcCommon: inventory.wcCommon,
          wcUncommon: inventory.wcUncommon,
          wcRare: inventory.wcRare,
          wcMythic: inventory.wcMythic,
          boosters: boosters,
          updated: new Date().getTime(),
        },
      };

      window.toolDb.putData("uuidData", newData, true);
    });
}
