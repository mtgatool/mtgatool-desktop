import { ArenaV3Deck } from "../../types";
import LogEntry from "../../types/logDecoder";
import convertDeckFromV3 from "../../utils/convertDeckFromV3";
import { getCachedDeck } from "../deckCache";
import selectDeck from "../selectDeck";

interface Entry extends LogEntry {
  json: {
    /** 2026 shape: the deck is named, not sent. */
    deckId?: string;
    botDeckId?: string;
    botMatchType?: number;
    /** Pre-2026 shape: the deck inline, as a JSON string. */
    params?: {
      deck?: string | ArenaV3Deck;
    };
  };
}

/**
 * Starting a practice game against the bot.
 *
 * This is the only place a bot match announces which deck the player queued. A
 * ranked or play-queue match submits its deck through `Event_SetDeckV2` /
 * `Event.DeckSubmitV3`, which is what fills `currentMatch.currentDeck`; a bot
 * match sends neither, so the deck stayed as whatever the last real match left
 * behind — the overlay kept showing the *previous* deck for the whole game,
 * along with its draw odds and cards left.
 *
 * Two payload shapes, because the label was renamed and gutted in the same
 * client update:
 *
 * - `Event.AIPractice` nested the whole decklist as a JSON *string* under
 *   `params.deck`, in the v3 shape where a list is a flat
 *   [id, quantity, id, quantity, …] array.
 * - `EventAiBotMatch` sends `{ deckId, botDeckId, botMatchType }` and no list
 *   at all. Arena stamps `LastPlayed` on the deck through `DeckUpsertDeckV3`
 *   immediately before, so the id resolves against what that cached.
 */
export default function OutEventAIPractice(entry: Entry): void {
  const { json } = entry;
  if (!json) return;

  // 2026: resolve the id against the deck Arena just saved.
  if (json.deckId) {
    const cached = getCachedDeck(json.deckId);
    if (cached) {
      selectDeck(cached);
    } else {
      // Not fatal — the match plays out with the previous deck, as it always
      // did — but it means the pairing with DeckUpsertDeckV3 no longer holds.
      // eslint-disable-next-line no-console
      console.log("No cached deck for bot match", json.deckId);
    }
    return;
  }

  const raw = json.params?.deck;
  if (!raw) return;

  try {
    const v3deck: ArenaV3Deck =
      typeof raw === "string" ? JSON.parse(raw) : (raw as ArenaV3Deck);
    if (!v3deck || !v3deck.mainDeck) return;

    selectDeck(convertDeckFromV3(v3deck));
  } catch (e) {
    // A malformed payload must not take down the log reader; the match simply
    // carries on without a known decklist, which is what happened before.
    // eslint-disable-next-line no-console
    console.log("Could not read the AI practice deck", e);
  }
}
