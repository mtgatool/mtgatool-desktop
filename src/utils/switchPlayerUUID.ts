import getGunUser from "../gun/getGunUser";
import setLocalSetting from "./setLocalSetting";

export default async function switchPlayerUUID(uuid: string) {
  setLocalSetting("playerId", uuid);

  const userRef = getGunUser();
  if (userRef) {
    userRef
      .get("uuidData")
      .get(uuid)
      .open((data) => {
        if (data) {
          window.economy.gold = data.gold;
          window.economy.gems = data.gems;
          window.economy.vaultProgress = data.vaultProgress;
          window.economy.wcTrackPosition = data.wcTrackPosition;
          window.economy.wcCommon = data.wcCommon;
          window.economy.wcUncommon = data.wcUncommon;
          window.economy.wcRare = data.wcRare;
          window.economy.wcMythic = data.wcMythic;
          window.economy.boosters = data.boosters;
        }
      });
  }
}
