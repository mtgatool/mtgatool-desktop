import { useMemo, useState } from "react";

import { ExploreDeckRow as Row } from "../../../data/fetchExploreDecks";
import { getCardArtCrop } from "../../../utils/getCardArtCrop";
import Deck from "../../../utils/mtga/deck";
import DeckColorsBar from "../../DeckColorsBar";
import DeckList from "../../DeckList";

export default function ExploreDeckRow({ row }: { row: Row }): JSX.Element {
  const [open, setOpen] = useState(false);

  const deck = useMemo(() => {
    const pd = (row.deck || {}) as any;
    const d = new Deck(pd, pd.mainDeck, pd.sideboard);
    d.setName(pd.name || "Unknown deck");
    d.tile = pd.deckTileId || d.tile;
    return d;
  }, [row.deck]);

  const wrColor = row.winrate >= 50 ? "var(--color-g)" : "var(--color-r)";

  return (
    <div style={{ marginBottom: "8px" }}>
      <div
        className="decks-table-deck-tile"
        onClick={() => setOpen(!open)}
        style={{
          backgroundImage: `url("${getCardArtCrop(deck.tile)}")`,
          cursor: "pointer",
        }}
      >
        <DeckColorsBar deck={deck} />
        <div className="decks-table-deck-inner">
          <div className="decks-table-deck-item">{deck.getName()}</div>
          <div
            className="decks-table-deck-item"
            style={{ textAlign: "center" }}
          >
            <span style={{ color: wrColor, fontSize: "18px" }}>
              {row.winrate.toFixed(1)}%
            </span>
          </div>
          <div
            className="decks-table-deck-item"
            style={{ color: "var(--color-text-dark)", fontSize: "13px" }}
          >
            {row.games} games · {row.wins}-{row.losses} · {row.pilots} pilots
          </div>
        </div>
      </div>
      {open && (
        <div style={{ padding: "8px 16px 16px" }}>
          <DeckList deck={deck} showWildcards />
        </div>
      )}
    </div>
  );
}
