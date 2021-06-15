/* eslint-disable no-bitwise */
import _ from "lodash";

import {
  RARITY_TOKEN,
  RARITY_LAND,
  RARITY_COMMON,
  RARITY_UNCOMMON,
  RARITY_RARE,
  RARITY_MYTHIC,
} from "../../../../types/collectionTypes";

export default function getRarityFilterVal(rarity: string): number {
  let ret = 0;
  switch (rarity) {
    case "token":
      ret = RARITY_TOKEN;
      break;
    case "land":
      ret = RARITY_LAND;
      break;
    case "common":
      ret = RARITY_COMMON;
      break;
    case "uncommon":
      ret = RARITY_UNCOMMON;
      break;
    case "rare":
      ret = RARITY_RARE;
      break;
    case "mythic":
      ret = RARITY_MYTHIC;
      break;
    default:
      ret = 0;
      break;
  }
  return ret;
}
