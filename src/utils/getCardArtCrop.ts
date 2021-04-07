/* eslint-disable radix */
import { database, DbCardData } from "mtgatool-shared";
import notFound from "../assets/images/notfound.png";
import notFoundArt from "../assets/images/notFoundArt.png";
import debugLog from "./debugLog";

export function getCardImage(
  card: DbCardData | number,
  quality: string
): string {
  if (card === undefined) {
    return notFound;
  }
  let cardObj: DbCardData | undefined;
  if (typeof card == "string") {
    cardObj = database.card(parseInt(card));
  } else if (typeof card == "number") {
    cardObj = database.card(card);
  } else {
    cardObj = card;
  }

  try {
    const url = cardObj?.images[quality];
    if (url === undefined || url === "") throw new Error("Undefined url");
    return cardObj?.images[quality] || notFound;
  } catch (e) {
    // eslint-disable-next-line no-console
    // debugLog(e, "error");
    debugLog(`Cant find card image: ${cardObj}, ${typeof cardObj}`, "info");
    return notFound;
  }
}

export function getCardArtCrop(card: DbCardData | number): string {
  const art = getCardImage(card, "art_crop");
  if (art == notFound) return notFoundArt;
  return art;
}
