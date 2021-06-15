import { DbCardData } from "../../../../../../mtgatool-shared/dist";
import database from "../../../../utils/database-wrapper";

export default function getCardInBoosters(card: DbCardData): boolean {
  const set = database.sets[card.set];
  if (set?.collation !== -1 && card.booster) {
    return true;
  }
  return false;
}
