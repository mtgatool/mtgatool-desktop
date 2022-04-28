import { DbCardData } from "mtgatool-shared/dist";
import allFormats from "../../../../common/allFormats";
import database from "../../../../utils/database-wrapper";
import findSetByCode from "../../../../utils/findSetByCode";

export default function getCardFormats(card: DbCardData): string[] {
  const allowed: string[] = [];
  const arenaSetCode: string[] = [card.set.toLowerCase()];
  if (card.set_digital) {
    arenaSetCode.push(card.set_digital.toLowerCase());
  }
  if (card.reprints && card.reprints !== true) {
    card.reprints.forEach((cid) => {
      const reprint = database.card(cid);
      if (reprint) {
        const setObj = findSetByCode(
          reprint.set_digital === "" ? reprint.set : reprint.set_digital
        );
        if (setObj) {
          arenaSetCode.push(setObj.arenacode);
        }
      }
    });
  }

  console.log(allFormats);

  Object.keys(allFormats).forEach((name) => {
    const format = allFormats[name];
    if (
      format.allowedTitleIds.includes(card.titleId) ||
      format.sets.some((set) => arenaSetCode.indexOf(set.toLowerCase()) >= 0)
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
