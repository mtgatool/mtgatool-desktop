import getWildcardsMissing from "./getWildcardsMissing";
import Deck from "./mtga/deck";

export default function getCardsMissingCount(
  deck: Deck,
  grpid: number
): number {
  const mainMissing = getWildcardsMissing(deck, grpid, false);
  const sideboardMissing = getWildcardsMissing(deck, grpid, true);
  return mainMissing + sideboardMissing;
}
