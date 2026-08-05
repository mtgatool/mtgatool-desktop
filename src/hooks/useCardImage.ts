/**
 * Card art for a grpId, resolved through the database.
 *
 * `getCardImage` accepts a grpId and looks it up itself, but that lookup is
 * synchronous: before the card has been fetched it returns undefined, and the
 * URL comes out with an undefined set and collector number, which Scryfall
 * answers with a placeholder image rather than an error. Every card on screen
 * then shows the same wrong art.
 *
 * These hooks resolve the card first and rebuild the URL when it lands.
 */
import { useMemo } from "react";

import { DbCardDataV2 } from "../types";
import { getCardArtCrop, getCardImage } from "../utils/getCardArtCrop";
import useCard from "./useCard";

/** Full card image. Empty string until the card is available. */
export default function useCardImage(
  grpId: number | undefined | null,
  quality: string
): string {
  const card = useCard(grpId);
  return useMemo(
    () => (card ? getCardImage(card, quality) : ""),
    [card, quality]
  );
}

/** Cropped art, the variant used for tiles and backgrounds. */
export function useCardArtCrop(grpId: number | undefined | null): string {
  const card = useCard(grpId);
  return useMemo(() => (card ? getCardArtCrop(card) : ""), [card]);
}

/** For call sites that already hold a resolved card. */
export function cardImageFor(
  card: DbCardDataV2 | null | undefined,
  quality: string
): string {
  return card ? getCardImage(card, quality) : "";
}
