import { useMemo } from "react";
import { useHistory } from "react-router-dom";

import useSavedDecks from "../../../hooks/useSavedDecks";
import { StatsDeck } from "../../../types/dbTypes";
import savedDeckToStatsDeck from "../../../utils/mtga/savedDeckToStatsDeck";
import vodiFn from "../../../utils/voidfn";
import DecksArtViewRow from "../../DecksArtViewRow";
import Section from "../../ui/Section";

interface SavedDecksListProps {
  active: boolean;
}

export default function SavedDecksList({
  active,
}: SavedDecksListProps): JSX.Element {
  const readerDecks = useSavedDecks();
  const history = useHistory();

  const decks = useMemo<StatsDeck[]>(
    () => readerDecks.map((rd) => savedDeckToStatsDeck(rd)),
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
