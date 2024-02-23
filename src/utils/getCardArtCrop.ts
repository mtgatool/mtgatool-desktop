/* eslint-disable no-nested-ternary */
/* eslint-disable radix */
import { database, DbCardDataV2 } from "mtgatool-shared";
import { DEFAULT_TILE } from "mtgatool-shared/dist/shared/constants";

import notFound from "../assets/images/notfound.png";
import notFoundArt from "../assets/images/notFoundArt.png";
import isCardDfcBack from "./isCardDfcBack";

export function getCardImage(
  card: DbCardDataV2 | number,
  quality: string
): string {
  if (card === undefined) {
    return notFound;
  }
  let cardObj: DbCardDataV2 | undefined;
  if (typeof card == "string") {
    cardObj = database.card(parseInt(card));
  } else if (typeof card == "number") {
    cardObj = database.card(card);
  } else {
    cardObj = card;
  }

  let set = cardObj
    ? cardObj.DigitalSet
      ? cardObj.DigitalSet
      : cardObj.Set
    : "";

  if (cardObj?.Set === "SPG") set = "SPG";

  const setName =
    database.setNames[set.toUpperCase()] ||
    database.setNames[set.toLowerCase()];
  if (setName) {
    set = database.sets[setName].scryfall;
  }

  const isDfc = isCardDfcBack(cardObj?.GrpId || DEFAULT_TILE);

  const replaceName = (cardObj?.Name || "")
    .replaceAll("'", "")
    .replaceAll("&", "");

  let finalUrl = `https://api.scryfall.com/cards/${
    cardObj?.IsToken ? "t" : ""
  }${set}/${cardObj?.CollectorNumber}?format=image${
    isDfc ? `&face=back` : ""
  }&version=${quality}`;

  if (set === "BC20") {
    finalUrl = `https://api.scryfall.com/cards/named?exact="${replaceName}"&set=pana&format=image${
      isDfc ? `&face=back` : ""
    }&version=${quality}`;
  }

  // Fuzzy search
  if (database.digitalSets.includes(setName)) {
    finalUrl = `https://api.scryfall.com/cards/named?exact="${replaceName}"&set=${
      cardObj?.IsToken ? "t" : ""
    }${set}&format=image${isDfc ? `&face=back` : ""}&version=${quality}`;
  }

  return encodeURI(finalUrl);
}

export function getCardArtCrop(card: DbCardDataV2 | number): string {
  const art = getCardImage(card, "art_crop");
  if (art == notFound) return notFoundArt;
  return art;
}
