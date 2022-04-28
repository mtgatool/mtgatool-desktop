import { DbCardData } from "mtgatool-shared/dist";

import findSetByCode from "../../../../utils/findSetByCode";

export default function getCardInBoosters(card: DbCardData): boolean {
  const set = findSetByCode(
    card.set_digital == "" ? card.set : card.set_digital
  );
  if (card.rarity === "land" || card.rarity === "token") return false;
  if (set?.collation === -1) return false;

  return true;
}
