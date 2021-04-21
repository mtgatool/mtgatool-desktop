import { Fragment } from "react";
import { useSelector } from "react-redux";
import useGunUser from "../../../hooks/useGunUser";
import { AppState } from "../../../redux/stores/rendererStore";
import DecksArtViewRow from "../../DecksArtViewRow";

export default function ViewDecks() {
  const [, loggedIn] = useGunUser();

  const { decksIndex, decks } = useSelector(
    (state: AppState) => state.mainData
  );

  return (
    <div className="section">
      <div className="decks-table-wrapper">
        {loggedIn &&
          decksIndex &&
          decks &&
          Object.keys(decksIndex)
            .map((key) => decks[`${key}-v${decksIndex[key]}`])
            .filter((d) => d)
            .sort((a, b) => {
              if (a.lastUsed > b.lastUsed) return -1;
              if (a.lastUsed < b.lastUsed) return 1;
              return 0;
            })
            .map((deck) => {
              if (deck && deck.internalDeck) {
                return <DecksArtViewRow key={deck.deckId} deck={deck} />;
              }
              return <Fragment key={deck.deckId} />;
            })}
      </div>
    </div>
  );
}
