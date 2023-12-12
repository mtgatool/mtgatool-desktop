import getCardFormats from "./getCardFormats";
import CardType from "./typesWrap";

export default function getCardIsCraftable(
  card: CardType,
  cards: Record<string, CardType>,
  setNames: any,
  sets: any
): boolean {
  if (card.Rarity === "land" || !card.IsToken) return false;

  if (card.LinkedFaceType === 11) {
    return false;
  }

  const formats = getCardFormats(card, cards, setNames, sets);
  if (
    formats.includes("Standard") ||
    formats.includes("Historic") ||
    formats.includes("Alchemy") ||
    formats.includes("Explorer") ||
    formats.includes("Timeless") ||
    formats.includes("Singleton")
  ) {
    return true;
  }
  return false;
}
