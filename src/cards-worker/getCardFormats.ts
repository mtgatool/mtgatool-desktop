import allFormats from "./allFormats";
import findSetByCode from "./findSetByCode";
import CardType from "./typesWrap";

export default function getCardFormats(
  card: CardType,
  allCards: Record<string, CardType>,
  setNames: any,
  sets: any
): string[] {
  const allowed: string[] = [];
  const arenaSetCode: string[] = [card.Set.toLowerCase()];
  if (card.DigitalSet) {
    arenaSetCode.push(card.DigitalSet.toLowerCase());
  }
  card.Reprints.forEach((cid: number) => {
    const reprint = allCards[cid];
    if (reprint) {
      const setObj = findSetByCode(
        reprint.DigitalSet === null || reprint.DigitalSet === ""
          ? reprint.Set
          : reprint.DigitalSet,
        setNames,
        sets
      );
      if (setObj) {
        arenaSetCode.push(setObj.arenacode);
      }
    }
  });

  Object.keys(allFormats).forEach((name) => {
    const format = allFormats[name];
    if (
      (format.allowedTitleIds.includes(card.TitleId) ||
        format.legalSets.some(
          (set: any) => arenaSetCode.indexOf(set.toLowerCase()) >= 0
        )) &&
      !format.bannedTitleIds.includes(card.TitleId)
    ) {
      if (name == "Pauper" || name == "HistoricPauper") {
        if (card.Rarity == "common") {
          allowed.push(name);
        }
      } else {
        allowed.push(name);
      }
    }
  });
  return allowed;
}
