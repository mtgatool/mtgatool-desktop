import { database, Deck } from "mtgatool-shared";

export default function getWildcardsMissing(
  deck: Deck,
  grpid: number,
  isSideboard?: boolean
): number {
  let mainQuantity = 0;
  const { cards } = window;
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
  if (!card?.reprints) arr = [grpid];
  else arr.push(grpid);

  let have = 0;
  arr.forEach((id) => {
    const n = cards[id];
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

    const infiniteCards = [67306, 69172]; // petitioners, rat colony, etc
    if (have >= 4 && infiniteCards.indexOf(grpid) >= 0) {
      copiesLeft = INFINITE;
    }
  }

  return Math.max(0, needed - copiesLeft);
}
