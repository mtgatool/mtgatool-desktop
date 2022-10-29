import findSetByCode from "./findSetByCode";
import CardType from "./typesWrap";

export default function getCardInBoosters(
  card: CardType,
  setNames: any,
  sets: any
): boolean {
  const set = findSetByCode(
    card.DigitalSet === null || card.DigitalSet === ""
      ? card.Set
      : card.DigitalSet,
    setNames,
    sets
  );

  if (card.IsToken) return false;
  if (set?.collation === -1) return false;

  if (card.LinkedFaceType === 11) {
    return false;
  }

  if (!card.IsPrimaryCard) {
    return false;
  }

  return true;
}
