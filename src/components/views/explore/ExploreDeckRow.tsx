import { useMemo } from "react";
import { useHistory, useParams } from "react-router-dom";

import { ExploreDeckRow as Row } from "../../../data/fetchExploreDecks";
import { getCardArtCrop } from "../../../utils/getCardArtCrop";
import Deck from "../../../utils/mtga/deck";
import DeckColorsBar from "../../DeckColorsBar";

export default function ExploreDeckRow({ row }: { row: Row }): JSX.Element {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();

  const deck = useMemo(() => {
    const pd = (row.deck || {}) as any;
    const d = new Deck(pd, pd.mainDeck, pd.sideboard);
    d.setName(pd.name || "Unknown deck");
    d.tile = pd.deckTileId || d.tile;
    return d;
  }, [row.deck]);

  const wrColor = row.winrate >= 50 ? "var(--color-g)" : "var(--color-r)";

  // Opens its own view rather than expanding in place: a decklist inside one
  // cell of the grid tore a hole in the layout, and the versions panel needs the
  // room anyway.
  const open = (): void =>
    history.push(
      `/explore/${encodeURIComponent(id)}/${encodeURIComponent(row.deck_hash)}`
    );

  return (
    <div
      className="decks-table-deck-tile"
      onClick={open}
      style={{
        backgroundImage: `url("${getCardArtCrop(deck.tile)}")`,
        cursor: "pointer",
      }}
    >
      <DeckColorsBar deck={deck} />
      <div className="decks-table-deck-inner">
        <div className="decks-table-deck-item">{deck.getName()}</div>
        <div className="decks-table-deck-item" style={{ textAlign: "center" }}>
          <span style={{ color: wrColor, fontSize: "18px" }}>
            {row.winrate.toFixed(1)}%
          </span>
        </div>
        <div
          className="decks-table-deck-item"
          style={{ color: "var(--color-text-dark)", fontSize: "13px" }}
        >
          {row.games} games · {row.wins}-{row.losses} ·{" "}
          {row.versions && row.versions > 1
            ? `${row.versions} versions`
            : `${row.pilots} pilot${row.pilots === 1 ? "" : "s"}`}
        </div>
      </div>
    </div>
  );
}
