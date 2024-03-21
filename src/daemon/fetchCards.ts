import upsertDbCards from "../toolDb/upsertDbCards";
import globalData from "../utils/globalData";
import fetchPlayerId from "./fetchPlayerId";

export default function fetchCards() {
  fetchPlayerId();
  const reader = globalData.mtgaReader;

  let cards = null;
  try {
    const inventory = reader.read("mtgaInventory") as any;
    cards = inventory?.cards;
  } catch (e) {
    console.debug("Error fetching cards", e);
  }
  console.debug("cards info", cards);

  if (cards?.data) {
    upsertDbCards(cards.data);
  }
}
