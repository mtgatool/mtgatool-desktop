import { MissingWildcards } from "mtgatool-shared";
import { CARD_RARITIES } from "mtgatool-shared/dist/shared/constants";
import store from "../redux/stores/rendererStore";

export default function getBoosterCountEstimate(
  neededWildcards: MissingWildcards
): number {
  let boosterCost = 0;
  const boosterEstimates = {
    common: 3.36,
    uncommon: 2.6,
    rare: 5.72,
    mythic: 13.24,
  };

  const { mainData } = store.getState();
  const uuid = mainData.currentUUID;

  if (!mainData?.uuidData[uuid]?.wcCommon) return 0;

  const ownedWildcards = {
    common: mainData.uuidData[uuid].wcCommon,
    uncommon: mainData.uuidData[uuid].wcUncommon,
    rare: mainData.uuidData[uuid].wcRare,
    mythic: mainData.uuidData[uuid].wcMythic,
  };

  CARD_RARITIES.forEach((rarity) => {
    if (rarity !== "land" && rarity !== "token") {
      const needed = neededWildcards[rarity] || 0;
      const owned = ownedWildcards[rarity] || 0;
      const missing = Math.max(0, needed - owned);
      boosterCost = Math.max(boosterCost, boosterEstimates[rarity] * missing);
    }
  });

  return Math.round(boosterCost);
}
