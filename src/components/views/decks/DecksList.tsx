import { Fragment, useCallback } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { AppState } from "../../../redux/stores/rendererStore";
import DecksArtViewRow from "../../DecksArtViewRow";
import Section from "../../Section";

export default function DecksList() {
  const history = useHistory();

  const { decksIndex, decks } = useSelector(
    (state: AppState) => state.mainData
  );

  const openDeck = useCallback(
    (id: string) => {
      history.push(`/decks/${id}`);
    },
    [history]
  );

  return (
    <Section style={{ margin: "16px 0" }}>
      <div className="decks-table-wrapper">
        {Object.keys(decksIndex)
          .map((key) => decks[`${key}-v${decksIndex[key]}`])
          .filter((d) => d)
          .sort((a, b) => {
            if (a.lastModified > b.lastModified) return -1;
            if (a.lastModified < b.lastModified) return 1;
            return 0;
          })
          .sort((a, b) => {
            if (a.lastUsed > b.lastUsed) return -1;
            if (a.lastUsed < b.lastUsed) return 1;
            return 0;
          })
          .map((deck) => {
            if (deck && deck.internalDeck) {
              return (
                <DecksArtViewRow
                  clickDeck={openDeck}
                  key={deck.deckId}
                  deck={deck}
                />
              );
            }
            return <Fragment key={deck.deckId} />;
          })}
      </div>
    </Section>
  );
}
