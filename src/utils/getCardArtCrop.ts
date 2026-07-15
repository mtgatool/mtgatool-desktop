/* eslint-disable no-nested-ternary */
/* eslint-disable radix */

import notFound from "../assets/images/notfound.png";
import notFoundArt from "../assets/images/notFoundArt.png";
import { DEFAULT_TILE } from "../constants";
import { DbCardDataV2 } from "../types";
import isCardDfcBack from "./isCardDfcBack";
import database from "./mtga/database";

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

  // Arena-only digital set that doesn't map to any Scryfall set code (e.g.
  // Y25-EOE, OMB-OM1, CUBE-52.60 cube collations). The set code lookup above
  // left `set` as the raw Arena code, so `/cards/{set}/{cn}` 404s. Resolve by
  // exact name instead, without a set constraint, so the card art still loads.
  if (!setName && !["BC20", "SPG"].includes(set)) {
    finalUrl = `https://api.scryfall.com/cards/named?exact="${replaceName}"&format=image${
      isDfc ? `&face=back` : ""
    }&version=${quality}`;
  }

  return encodeURI(finalUrl);
}

export function getCardArtCrop(card: DbCardDataV2 | number): string {
  const art = getCardImage(card, "art_crop");
  if (art == notFound) return notFoundArt;
  return art;
}
