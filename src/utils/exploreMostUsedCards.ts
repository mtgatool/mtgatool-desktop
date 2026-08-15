/**
 * "Most used cards" for an event, aggregated from real decklists.
 *
 * The opponent meta view can only say how often a card was *seen*, because
 * opponent quantities are inferred from what got played. These decks are our
 * own users' lists, so the quantities are exact — which is what makes "average
 * copies per deck" meaningful at all.
 *
 * Counts are per deck, never per game: a card in a deck that played 40 matches
 * counts once, the same as one that played 5. The deck rows handed in should
 * already be the clustered ones (see `deckSimilarity`), so a list tweaked
 * between sessions counts as the one deck it is.
 */
import { ExploreDeckRow } from "../data/fetchExploreDecks";
import database from "./mtga/database";

export interface MostUsedCard {
  /** A representative printing — the one to render. */
  grpid: number;
  /** Front face, which is also the key printings are merged under. */
  name: string;
  /** How many decks run at least one copy. */
  decks: number;
  /** Copies across all of those decks. */
  copies: number;
  avgPerDeck: number;
  /** Games played by the decks running it, as a weight for the win rate. */
  games: number;
  wins: number;
  /** Win rate of the decks running it — not of the card. */
  deckWinrate: number;
}

/**
 * Aggregate the decklists into per-card usage.
 *
 * Printings are merged by front-face name: Arena mints a new grpId per
 * printing, so a reprint would otherwise split one card into several entries,
 * each with a fraction of the decks. Within a single deck the merged copies are
 * summed first, so a list running two printings of the same card reports 4
 * copies rather than counting as two decks.
 *
 * Lands are excluded for the same reason the opponent meta excludes them: they
 * are most of the list and none of the signal. Unfiltered, the top of Timeless
 * is Watery Grave rather than the spells that define the deck.
 */
export default function aggregateMostUsedCards(
  decks: ExploreDeckRow[]
): MostUsedCard[] {
  const byName = new Map<string, MostUsedCard>();

  decks.forEach((row) => {
    const mainDeck = row.deck?.mainDeck || [];
    if (mainDeck.length === 0) return;

    // Collapse this one deck first, so the outer counter can add exactly one
    // deck per card no matter how many printings the list mixes.
    const inThisDeck = new Map<string, { grpid: number; copies: number }>();

    mainDeck.forEach((entry: { id?: number; quantity?: number }) => {
      if (!entry?.id) return;
      const card = database.card(entry.id);
      if (!card || card.Types.includes("Land")) return;

      const name = card.Name.split(" // ")[0];
      const copies = entry.quantity || 0;
      if (copies <= 0) return;

      const seen = inThisDeck.get(name);
      if (seen) seen.copies += copies;
      else inThisDeck.set(name, { grpid: entry.id, copies });
    });

    inThisDeck.forEach(({ grpid, copies }, name) => {
      const acc = byName.get(name);
      if (!acc) {
        byName.set(name, {
          grpid,
          name,
          decks: 1,
          copies,
          avgPerDeck: copies,
          games: row.games || 0,
          wins: row.wins || 0,
          deckWinrate: 0,
        });
        return;
      }
      acc.decks += 1;
      acc.copies += copies;
      acc.games += row.games || 0;
      acc.wins += row.wins || 0;
    });
  });

  return [...byName.values()]
    .map((c) => ({
      ...c,
      avgPerDeck: c.decks ? c.copies / c.decks : 0,
      deckWinrate: c.games ? (c.wins / c.games) * 100 : 0,
    }))
    .sort((a, b) => b.decks - a.decks || b.avgPerDeck - a.avgPerDeck);
}
