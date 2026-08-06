import getDeckRaritiesCount from "../utils/getDeckRaritiesCount";
import Deck from "../utils/mtga/deck";

const RARITIES = [
  { key: "m", icon: "wc-mythic", name: "Mythic" },
  { key: "r", icon: "wc-rare", name: "Rare" },
  { key: "u", icon: "wc-uncommon", name: "Uncommon" },
  { key: "c", icon: "wc-common", name: "Common" },
] as const;

/**
 * What the deck is made of, by rarity.
 *
 * Split out from the wildcard cost below it, which is a different question.
 * The two used to share a component, so this row was rendering the wildcard
 * preset's booster estimate off the *rarity counts* — a number in the hundreds
 * that answered nothing anybody asked.
 */
export default function DeckRarities(props: { deck: Deck }): JSX.Element {
  const { deck } = props;
  const counts = getDeckRaritiesCount(deck);
  const total = counts.m + counts.r + counts.u + counts.c;

  return (
    <div className="deck-rarities">
      {RARITIES.map((rarity) => (
        <div className="deck-rarity" key={rarity.key} title={rarity.name}>
          <div className={`deck-rarity-icon ${rarity.icon}`} />
          <div className="deck-rarity-count">{counts[rarity.key]}</div>
          <div className="deck-rarity-name">{rarity.name}</div>
        </div>
      ))}
      <div
        className="deck-rarity total"
        title="Cards excluding lands and tokens"
      >
        <div className="deck-rarity-icon deck-rarity-cards" />
        <div className="deck-rarity-count">{total}</div>
        <div className="deck-rarity-name">Cards</div>
      </div>
    </div>
  );
}
