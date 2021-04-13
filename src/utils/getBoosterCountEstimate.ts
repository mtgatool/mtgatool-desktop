import { MissingWildcards } from "mtgatool-shared";
import { CARD_RARITIES } from "mtgatool-shared/dist/shared/constants";

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

  // const playerEconomy = store.getState().playerdata.economy;

  const ownedWildcards = {
    common: window.economy.wcCommon,
    uncommon: window.economy.wcUncommon,
    rare: window.economy.wcRare,
    mythic: window.economy.wcMythic,
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
