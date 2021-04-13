import useGunSelectorObject from "../../../hooks/useGunSelectorObject";
import { GunUser, GunUserChain } from "../../../types/gunTypes";

export default function ViewDecks() {
  const userRef = window.gun.user() as GunUserChain;
  const decksIndexRef = userRef.get("decksIndex");
  const decksIndex = useGunSelectorObject<GunUser["decksIndex"]>(decksIndexRef);

  const decksRef = userRef.get("decks");
  const decks = useGunSelectorObject<GunUser["decks"]>(decksRef);
  console.log(decksIndex, decks);

  return (
    <div>
      {decksIndex &&
        decks &&
        Object.keys(decksIndex).map((deckId) => {
          const deckKey = `${deckId}-v${decksIndex[deckId]}`;
          return <div key={deckId}>{decks[deckKey]?.name ?? deckId}</div>;
        })}
    </div>
  );
}
