import { useMemo, useState } from "react";

import useSavedDecks from "../../../hooks/useSavedDecks";
import { getCardArtCrop } from "../../../utils/getCardArtCrop";
import db from "../../../utils/mtga/database";
import Deck from "../../../utils/mtga/deck";
import readerDeckToDeck from "../../../utils/mtga/readerDeckToDeck";
import DeckColorsBar from "../../DeckColorsBar";
import Section from "../../ui/Section";

function cardCount(deck: Deck): number {
  return deck
    .getMainboard()
    .get()
    .reduce((sum, c) => sum + c.quantity, 0);
}

function CardLines({ deck }: { deck: Deck }): JSX.Element {
  const rows = (board: "main" | "side") => {
    const list =
      board === "main" ? deck.getMainboard().get() : deck.getSideboard().get();
    return list.map((c) => (
      <div
        key={`${board}-${c.id}`}
        style={{ display: "flex", lineHeight: "20px" }}
      >
        <div style={{ width: "28px", color: "var(--color-text-dark)" }}>
          {c.quantity}
        </div>
        <div>{db.card(c.id)?.Name || `#${c.id}`}</div>
      </div>
    ));
  };

  const side = deck.getSideboard().get();

  return (
    <div style={{ display: "flex", gap: "32px", padding: "8px 16px 16px" }}>
      <div>
        <div className="deck-list-title">Deck</div>
        {rows("main")}
      </div>
      {side.length > 0 && (
        <div>
          <div className="deck-list-title">Sideboard</div>
          {rows("side")}
        </div>
      )}
    </div>
  );
}

function SavedDeckRow({ deck }: { deck: Deck }): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginBottom: "8px" }}>
      <div
        className="list-item-container"
        style={{ cursor: "pointer", alignItems: "center" }}
        onClick={() => setOpen(!open)}
      >
        <div
          style={{
            width: "128px",
            height: "48px",
            backgroundImage: `url(${getCardArtCrop(deck.tile)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: "3px",
          }}
        />
        <div style={{ margin: "auto 16px", flex: 1 }}>
          <div style={{ color: "var(--color-text)", fontSize: "16px" }}>
            {deck.getName() || "Untitled deck"}
          </div>
          <div style={{ color: "var(--color-text-dark)", fontSize: "13px" }}>
            {cardCount(deck)} cards
          </div>
        </div>
        <div style={{ width: "160px", margin: "auto 16px" }}>
          <DeckColorsBar deck={deck} />
        </div>
      </div>
      {open && <CardLines deck={deck} />}
    </div>
  );
}

interface SavedDecksListProps {
  active: boolean;
}

export default function SavedDecksList({
  active,
}: SavedDecksListProps): JSX.Element {
  const readerDecks = useSavedDecks();

  const decks = useMemo(
    () => readerDecks.map((rd) => readerDeckToDeck(rd)),
    [readerDecks]
  );

  if (!active) return <></>;

  return (
    <Section style={{ flexDirection: "column", marginTop: "16px" }}>
      {decks.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "var(--color-text-dark)",
            padding: "32px",
          }}
        >
          No saved decks yet. Open MTG Arena (elevated) and visit the Decks
          screen — your saved decks are read from the game and will appear here.
        </div>
      ) : (
        decks.map((deck) => <SavedDeckRow key={deck.id} deck={deck} />)
      )}
    </Section>
  );
}
