import { CardObject } from "../types";
import getCardTypeSort from "./getCardTypeSort";
import database from "./mtga/database";

export default function compareCards(a: CardObject, b: CardObject): number {
  // Yeah this is lazy.. I know
  const aObj = database.card(a.id);
  const bObj = database.card(b.id);

  if (!aObj) return 1;
  if (!bObj) return -1;

  const _as = getCardTypeSort(aObj.Types);
  const _bs = getCardTypeSort(bObj.Types);

  // Order by type?
  if (_as < _bs) {
    return -1;
  }
  if (_as > _bs) {
    return 1;
  }

  // by cmc
  if (aObj.Cmc < bObj.Cmc) {
    return -1;
  }
  if (aObj.Cmc > bObj.Cmc) {
    return 1;
  }

  // then by name
  if (aObj.Name < bObj.Name) {
    return -1;
  }
  if (aObj.Name > bObj.Name) {
    return 1;
  }

  return 0;
}
