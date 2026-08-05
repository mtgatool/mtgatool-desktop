import notFound from "../assets/images/notfound.png";
import { DEFAULT_TILE } from "../constants";
import { DbCardDataV2 } from "../types";
import database from "./database-wrapper";
import { getCardImage } from "./getCardArtCrop";

/**
 * The back face's image, for a double-faced card.
 *
 * Takes an already-resolved card where the caller has one. Looking a grpId up
 * here only returns what has already been fetched, so on a first hover it
 * produced a URL built from undefined — which Scryfall answers with a
 * placeholder rather than an error, so nothing failed visibly.
 */
export default function getBackUrl(
  card: DbCardDataV2 | number | undefined | null,
  quality: string
): string {
  const cardObj =
    typeof card === "number" ? database.card(card) : card ?? undefined;
  if (!cardObj) return "";

  const backId = cardObj.LinkedFaceGrpIds[0];
  if (!backId) return "";

  const back = database.card(backId);
  const newImg = getCardImage(back ?? DEFAULT_TILE, quality);

  return newImg || notFound;
}
