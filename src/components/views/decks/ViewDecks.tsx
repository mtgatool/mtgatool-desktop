import { Fragment } from "react";
import useGunSelectorObject from "../../../hooks/useGunSelectorObject";
import useGunUser from "../../../hooks/useGunUser";
import { GunUser } from "../../../types/gunTypes";
import DecksArtViewRow from "../../DecksArtViewRow";

export default function ViewDecks() {
  const [userRef, loggedIn] = useGunUser();

  const decksIndexRef = userRef.get("decksIndex");
  const decksIndex = useGunSelectorObject<GunUser["decksIndex"]>(
    decksIndexRef,
    true
  );

  const decksRef = userRef.get("decks");
  const decks = useGunSelectorObject<GunUser["decks"]>(decksRef, true);

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
