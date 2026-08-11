import { useMemo } from "react";
import { useHistory } from "react-router-dom";

import useSavedDecks from "../../../hooks/useSavedDecks";
import { StatsDeck } from "../../../types/dbTypes";
import savedDeckToStatsDeck from "../../../utils/mtga/savedDeckToStatsDeck";
import vodiFn from "../../../utils/voidfn";
import DecksArtViewRow from "../../DecksArtViewRow";
import { MatchFormat } from "../../ui/FormatToggle";
import Section from "../../ui/Section";

interface SavedDecksListProps {
  active: boolean;
  nameFilter?: string;
  /** Selected mana colors as bits; a deck must be a subset of them. */
  colorBits?: number;
  format?: MatchFormat;
}

export default function SavedDecksList({
  active,
  nameFilter,
  colorBits,
  format,
}: SavedDecksListProps): JSX.Element {
  const readerDecks = useSavedDecks();
  const history = useHistory();

  const decks = useMemo<StatsDeck[]>(
    () =>
      readerDecks
        .map((rd) => savedDeckToStatsDeck(rd))
        .filter(
          (d) =>
            !nameFilter ||
            d.name.toLowerCase().indexOf(nameFilter.toLowerCase()) !== -1
        )
        // Same subset rule the played-decks colors filter uses, including
        // its normalization of the colorless flag on colored decks.
        .filter((d) => {
          if (colorBits === undefined) return true;
          const c = d.colors > 32 ? d.colors - 32 : d.colors;
          // eslint-disable-next-line no-bitwise
          return (colorBits | c) === colorBits;
        })
        .filter((d) => !format || !!d.limited === (format === "limited")),
    [readerDecks, nameFilter, colorBits, format]
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
          {readerDecks.length > 0
            ? "No saved decks match the current filters."
            : "No saved decks yet. Open MTG Arena (elevated) and visit the " +
              "Decks screen — your saved decks are read from the game and " +
              "will appear here."}
        </div>
      ) : (
        <div className="decks-table-wrapper">
          {decks.map((deck) => (
            <DecksArtViewRow
              key={deck.id}
              deck={deck}
              clickDeck={(d) =>
                history.push(`/decks/${encodeURIComponent(d.id)}`)
              }
              hidden={false}
              hide={vodiFn}
              unhide={vodiFn}
              showArchive={false}
            />
          ))}
        </div>
      )}
    </Section>
  );
}
