/**
 * Make sure every card in a deck is loaded before the deck is rendered.
 *
 * Deck views read cards synchronously, all the way down — `DeckList` groups the
 * mainboard by card type, `cardsSort` compares Cmc and Name, `CardTile` reads
 * the card for its colours. None of that can await, and none of it triggers a
 * fetch, so a deck whose cards had never been asked for rendered as nothing at
 * all: `DeckList` maps each card to `database.card(id)` and filters out the
 * undefined ones, which was every one of them.
 *
 * So the view boundary asks for them. One batched query covers a whole deck —
 * the client coalesces the ids into a single round trip — and every synchronous
 * read below this point then hits the cache.
 */
import { useMemo } from "react";

import Deck from "../utils/mtga/deck";
import { useCards } from "./useCard";

/** Every distinct grpId a deck can render: main, side, commanders, companion. */
export function deckGrpIds(deck: Deck | undefined | null): number[] {
  if (!deck) return [];

  const ids: number[] = [];
  const push = (id: number | null | undefined): void => {
    if (id) ids.push(id);
  };

  deck
    .getMainboard()
    .get()
    .forEach((card) => push(card.id));
  deck
    .getSideboard()
    .get()
    .forEach((card) => push(card.id));
  deck.getCommanders().forEach(push);
  push(deck.getCompanion());

  return [...new Set(ids)];
}

export interface DeckCardsState {
  /** True once every card in the deck has been looked up. */
  ready: boolean;
  /** How many of the deck's cards are loaded, for progressive rendering. */
  loaded: number;
  total: number;
}

export default function useDeckCards(
  deck: Deck | undefined | null
): DeckCardsState {
  const grpIds = useMemo(() => deckGrpIds(deck), [deck]);

  const cards = useCards(grpIds);

  const loaded = cards.filter(Boolean).length;
  return {
    // An empty deck is trivially ready; so is one whose cards all resolved.
    ready: grpIds.length === 0 || loaded > 0,
    loaded,
    total: grpIds.length,
  };
}
