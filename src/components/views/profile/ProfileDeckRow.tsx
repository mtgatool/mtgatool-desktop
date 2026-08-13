import { useMemo } from "react";

import { DEFAULT_TILE } from "../../../constants";
import { PlayerDeckRow } from "../../../data/publicProfiles";
import { useCards } from "../../../hooks/useCard";
import { StatsDeck } from "../../../types/dbTypes";
import Deck from "../../../utils/mtga/deck";
import vodiFn from "../../../utils/voidfn";
import DecksArtViewRow from "../../DecksArtViewRow";

interface ProfileDeckRowProps {
  row: PlayerDeckRow;
  clickDeck: (row: PlayerDeckRow) => void;
}

/**
 * One of a profile's decks, drawn with the same art row the Home tab's "Top
 * decks" uses, record included.
 */
export default function ProfileDeckRow({
  row,
  clickDeck,
}: ProfileDeckRowProps): JSX.Element {
  const pd = row.deck ?? {};

  // Colors are read off the deck's lands, which is a card lookup — empty on
  // a cold public page. Prefetch and rebuild once the cards land (same as
  // the Home tab's top decks).
  const grpIds = useMemo(
    () => [...new Set((pd.mainDeck ?? []).map((c) => c.id))],
    [pd.mainDeck]
  );
  const resolvedCards = useCards(grpIds);

  const statsDeck: StatsDeck = useMemo(() => {
    const deck = new Deck(pd);
    return {
      id: row.id,
      name: pd.name || "Unknown deck",
      deckTileId: pd.deckTileId || DEFAULT_TILE,
      mainDeck: pd.mainDeck || [],
      sideboard: pd.sideboard || [],
      colors:
        deck.colors.getBits() ||
        (typeof pd.colors === "number" ? pd.colors : 0),
      playerId: "",
      deckHash: row.id,
      matches: {},
      lastUsed: new Date(row.last_played).getTime(),
      stats: {
        gameWins: 0,
        gameLosses: 0,
        matchWins: row.wins,
        matchLosses: row.games - row.wins,
      },
      totalGames: row.games,
      cardWinrates: {},
      winrate: row.games ? (row.wins / row.games) * 100 : 0,
    };
    // resolvedCards is the point: the colors above are only right once the
    // lookups have come back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row, pd, resolvedCards]);

  return (
    <DecksArtViewRow
      deck={statsDeck}
      clickDeck={(): void => clickDeck(row)}
      hidden={false}
      hide={vodiFn}
      unhide={vodiFn}
      showArchive={false}
    />
  );
}
