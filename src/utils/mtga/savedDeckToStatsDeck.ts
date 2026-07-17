import { DEFAULT_TILE } from "../../constants";
import { StatsDeck } from "../../types/dbTypes";
import { ReaderDeck } from "../mtgaReader";
import readerDeckToDeck from "./readerDeckToDeck";

/**
 * Adapt a memory-read saved deck into the StatsDeck shape used by the played
 * decks list (DecksArtViewRow) and DeckView. Saved decks have no match history,
 * so all stat fields are zeroed — they render with the same art-tile look as
 * played decks, just without winrates/progress.
 */
export default function savedDeckToStatsDeck(
  readerDeck: ReaderDeck
): StatsDeck {
  const deck = readerDeckToDeck(readerDeck);
  const save = deck.getSave();

  return {
    id: save.id,
    deckTileId: save.deckTileId ?? DEFAULT_TILE,
    name: save.name,
    mainDeck: save.mainDeck,
    sideboard: save.sideboard,
    playerId: "",
    deckHash: "",
    matches: {},
    colors: deck.colors.getBits(),
    lastUsed: 0,
    stats: {
      gameWins: 0,
      gameLosses: 0,
      matchWins: 0,
      matchLosses: 0,
    },
    totalGames: 0,
    cardWinrates: {},
    winrate: 0,
  };
}
