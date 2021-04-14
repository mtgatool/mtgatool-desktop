import useGunSelectorObject from "../../../hooks/useGunSelectorObject";
import { GunUser, GunUserChain } from "../../../types/gunTypes";
import DecksArtViewRow from "../../DecksArtViewRow";

export default function ViewDecks() {
  const userRef = window.gun.user() as GunUserChain;
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
        {decksIndex &&
          decks &&
          Object.keys(decksIndex).map((deckId) => {
            const deckKey = `${deckId}-v${decksIndex[deckId]}`;
            if (decks[deckKey] && decks[deckKey].internalDeck) {
              return <DecksArtViewRow key={deckId} deck={decks[deckKey]} />;
            }
            return <></>;
          })}
      </div>
    </div>
  );
}
