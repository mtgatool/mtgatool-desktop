import store from "../redux/stores/rendererStore";
import { defaultCardsData } from "../types/dbTypes";
import database from "./mtga/database";
import Deck from "./mtga/deck";

export default function getWildcardsMissing(
  deck: Deck,
  grpid: number,
  isSideboard?: boolean
): number {
  let mainQuantity = 0;

  const { currentUUID, uuidData } = store.getState().mainData;
  const cards = uuidData[currentUUID]?.cards || defaultCardsData;

  const mainMatches = deck
    .getMainboard()
    .get()
    .filter((card) => card.id == grpid);
  if (mainMatches.length) {
    mainQuantity = mainMatches[0].quantity;
  }

  let sideboardQuantity = 0;
  const sideboardMatches = deck
    .getSideboard()
    .get()
    .filter((card) => card.id == grpid);
  if (sideboardMatches.length) {
    sideboardQuantity = sideboardMatches[0].quantity;
  }

  let needed = mainQuantity;
  if (isSideboard) {
    needed = sideboardQuantity;
  }
  // cap at 4 copies to handle petitioners, rat colony, etc
  needed = Math.min(4, needed);

  const card = database.card(grpid);
  // Arena counts a card's copies across every printing, not per printing:
  // https://magic.wizards.com/en/news/mtg-arena/upcoming-improvements-to-reprints
  // Own four of any one printing and you may play four of any other — which is
  // also why Arena grants only a single copy of a new printing once you have a
  // playset. Counting just `grpid` therefore reports cards as missing that are
  // perfectly playable. `Reprints` lists the sibling printings and excludes the
  // card itself, so it has to be added back in.
  const ids = [grpid, ...(card?.Reprints ?? [])];

  let have = 0;
  ids.forEach((id) => {
    const n = cards.cards[id];
    if (n !== undefined) {
      have += n;
    }
  });

  // Set to a high number to simulate infinity
  const INFINITE = 999;
  // >= rather than ==: summing across printings routinely exceeds four (a
  // playset of two different printings is eight), and an exact check would
  // silently skip the playset case it exists to handle.
  if (have >= 4) {
    have = INFINITE;
  }

  let copiesLeft = have;
  if (isSideboard) {
    copiesLeft = Math.max(0, copiesLeft - mainQuantity);

    const infiniteCards = [69172, 67306, 76490]; // petitioners, rat colony, etc
    if (have >= 4 && infiniteCards.indexOf(grpid) >= 0) {
      copiesLeft = INFINITE;
    }
  }

  return Math.max(0, needed - copiesLeft);
}
