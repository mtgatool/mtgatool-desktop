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

  // The metadata build resolved where this card's art actually lives, which is
  // not derivable from Set + CollectorNumber: Scryfall has no print at all at
  // Arena's address for ~1300 cards, and a DIFFERENT card at it for ~500 more
  // (Arena's ktk/252 is an Island, Scryfall's is a Plains). Everything below
  // this is the old derivation, kept for cards the build could not place and
  // for databases predating art resolution.
  if (cardObj?.Art) {
    return encodeURI(
      `https://api.scryfall.com/cards/${cardObj.Art.s}/${cardObj.Art.n}` +
        `?format=image${isDfc ? `&face=back` : ""}&version=${quality}`
    );
  }

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

  // Arena reports no collector number for ~98 cards — almost all of them
  // Special Guests, where the set DOES resolve, so none of the fallbacks above
  // catch it and the URL ends up as `/cards/spg/0`. That is why Chrome Mox had
  // no art. Look it up by name instead, keeping the set constraint when we
  // actually resolved one so the right printing still wins.
  if (!cardObj?.CollectorNumber || `${cardObj.CollectorNumber}` === "0") {
    finalUrl = `https://api.scryfall.com/cards/named?exact="${replaceName}"${
      setName ? `&set=${set}` : ""
    }&format=image${isDfc ? `&face=back` : ""}&version=${quality}`;
  }

  return encodeURI(finalUrl);
}

export function getCardArtCrop(card: DbCardDataV2 | number): string {
  const art = getCardImage(card, "art_crop");
  if (art == notFound) return notFoundArt;
  return art;
}

/**
 * How this card's art was resolved, for the substitute marker in the UI.
 *
 * Null when the art is the printing Arena actually ships — which is the normal
 * case and needs no disclosure. Non-null means Scryfall has no record of
 * Arena's printing and the image is another printing of the same card: right
 * card, possibly a different illustration.
 */
export function getSubstituteArtNote(
  card: DbCardDataV2 | null | undefined
): string | null {
  if (!card?.Art?.sub) return null;
  const setName = database.artSets[card.Art.s];
  const where = setName
    ? `${setName} (${card.Art.s.toUpperCase()})`
    : card.Art.s.toUpperCase();
  return (
    `Scryfall has no image for this printing, so the art shown is from ` +
    `${where} #${card.Art.n}.`
  );
}
