import findSetByCode from "./findSetByCode";

export default function getCardInBoosters(
  card: any,
  setNames: any,
  sets: any
): boolean {
  const set = findSetByCode(
    card.set_digital == "" ? card.set : card.set_digital,
    setNames,
    sets
  );

  if (card.rarity === "land" || card.rarity === "token") return false;
  if (set?.collation === -1) return false;

  if (card.dfc === 11) {
    return false;
  }

  return true;
}
