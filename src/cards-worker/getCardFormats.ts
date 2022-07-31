import allFormats from "./allFormats";
import findSetByCode from "./findSetByCode";

export default function getCardFormats(
  card: any,
  allCards: any,
  setNames: any,
  sets: any
): string[] {
  const allowed: string[] = [];
  const arenaSetCode: string[] = [card.set.toLowerCase()];
  if (card.set_digital) {
    arenaSetCode.push(card.set_digital.toLowerCase());
  }
  if (card.reprints && card.reprints !== true) {
    card.reprints.forEach((cid: any) => {
      const reprint = allCards[cid];
      if (reprint) {
        const setObj = findSetByCode(
          reprint.set_digital === "" ? reprint.set : reprint.set_digital,
          setNames,
          sets
        );
        if (setObj) {
          arenaSetCode.push(setObj.arenacode);
        }
      }
    });
  }

  Object.keys(allFormats).forEach((name) => {
    const format = allFormats[name];
    if (
      format.allowedTitleIds.includes(card.titleId) ||
      format.sets.some(
        (set: any) => arenaSetCode.indexOf(set.toLowerCase()) >= 0
      )
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
