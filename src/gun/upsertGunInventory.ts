import { PlayerInventory } from "mtgatool-shared";
import getLocalSetting from "../utils/getLocalSetting";
import getGunUser from "./getGunUser";
import gunRefExists from "./gunRefExists";

export default async function upsertGunInventory(inventory: PlayerInventory) {
  const userRef = getGunUser();

  const boosters: Record<string, number> = {};
  inventory.boosters.forEach((b) => {
    boosters[b.collationId] = b.count;
  });

  console.log("> Upsert inventory", inventory);

  if (userRef) {
    userRef
      .get("uuidData")
      .get(getLocalSetting("playerId") || "default")
      .put({
        gold: inventory.gold,
        gems: inventory.gems,
        vaultProgress: inventory.vaultProgress,
        wcTrackPosition: inventory.wcTrackPosition,
        wcCommon: inventory.wcCommon,
        wcUncommon: inventory.wcUncommon,
        wcRare: inventory.wcRare,
        wcMythic: inventory.wcMythic,
        boosters: boosters,
      });

    const defaultUUIDExists = await gunRefExists(userRef.get("defaultUUID"));
    if (!defaultUUIDExists) {
      userRef.get("defaultUUID").put(inventory.playerId);
    }
  }
  return true;
}
