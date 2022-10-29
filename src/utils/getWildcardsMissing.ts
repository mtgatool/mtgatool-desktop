import { database, Deck } from "mtgatool-shared";
import store from "../redux/stores/rendererStore";
import { defaultCardsData } from "../types/dbTypes";

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
  let arr = [];
  if (!card?.Reprints) arr = [grpid];
  else arr.push(grpid);

  let have = 0;
  arr.forEach((id) => {
    const n = cards.cards[id];
    if (n !== undefined) {
      have += n;
    }
  });

  // Set to a high number to simulate infinity
  const INFINITE = 999;
  if (have == 4) {
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
