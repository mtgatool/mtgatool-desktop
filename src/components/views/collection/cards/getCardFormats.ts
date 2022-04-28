import { DbCardData } from "mtgatool-shared/dist";
import allFormats from "../../../../common/allFormats";
import database from "../../../../utils/database-wrapper";

export default function getCardFormats(card: DbCardData): string[] {
  const allowed: string[] = [];
  const arenaSetCode: string[] = [
    database.sets[card.set]?.arenacode || card.set,
  ];
  if (card.reprints && card.reprints !== true) {
    card.reprints.forEach((cid) => {
      const reprint = database.card(cid);
      if (reprint) {
        const reprintSet =
          database.sets[reprint.set]?.arenacode || reprint.set_digital === ""
            ? reprint.set
            : reprint.set_digital;
        arenaSetCode.push(reprintSet);
      }
    });
  }

  Object.keys(allFormats).forEach((name) => {
    const format = allFormats[name];
    if (
      format.allowedTitleIds.includes(card.titleId) ||
      format.sets.some((set) => arenaSetCode.indexOf(set) >= 0)
    ) {
      if (name == "Pauper" || name == "HistoricPauper") {
        if (card.rarity == "common") {
          allowed.push(name);
        }
      } else {
        allowed.push(name);
      }
    }
  });
  return allowed;
}
