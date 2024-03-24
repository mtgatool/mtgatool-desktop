import upsertDbCards from "../toolDb/upsertDbCards";
import globalData from "../utils/globalData";
import fetchPlayerId from "./fetchPlayerId";

export default function fetchCards() {
  fetchPlayerId();
  const reader = globalData.mtgaReader;

  const { cards } = reader.read("mtgaInventory") as any;
  console.debug("cards info", cards);

  if (cards?.data) {
    upsertDbCards(cards.data);
  }
}
