export const RANK_BRONZE = 1;
export const RANK_SILVER = 2;
export const RANK_GOLD = 4;
export const RANK_PLATINUM = 8;
export const RANK_DIAMOND = 16;
export const RANK_MYTHIC = 32;

export default function getRankFilterVal(rank: string): number {
  let ret = 0;
  switch (rank) {
    case "Bronze":
      ret = RANK_BRONZE;
      break;
    case "Silver":
      ret = RANK_SILVER;
      break;
    case "Gold":
      ret = RANK_GOLD;
      break;
    case "Platinum":
      ret = RANK_PLATINUM;
      break;
    case "Diamond":
      ret = RANK_DIAMOND;
      break;
    case "Mythic":
      ret = RANK_MYTHIC;
      break;
    default:
      break;
  }
  return ret;
}
