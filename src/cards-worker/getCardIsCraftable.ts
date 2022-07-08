import getCardFormats from "./getCardFormats";

export default function getCardIsCraftable(
  card: any,
  cards: any,
  setNames: any,
  sets: any
): boolean {
  if (card.rarity === "land" || card.rarity === "token") return false;

  if (card.dfc === 11) {
    return false;
  }

  const formats = getCardFormats(card, cards, setNames, sets);
  if (
    formats.includes("Standard") ||
    formats.includes("Historic") ||
    formats.includes("Singleton") ||
    formats.includes("Alchemy") ||
    formats.includes("Explorer")
  ) {
    return true;
  }
  return false;
}
