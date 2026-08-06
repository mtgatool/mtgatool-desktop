import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";

import useCardImage from "../hooks/useCardImage";
import useHoverCard from "../hooks/useHoverCard";
import { AppState } from "../redux/stores/rendererStore";
import { DbCardDataV2 } from "../types";
import getSampleHand from "../utils/getSampleHand";
import Deck from "../utils/mtga/deck";

interface SampleCardProps {
  card: DbCardDataV2;
  /** Position in the hand — staggers the deal so cards arrive one by one. */
  index: number;
}

function SampleCard(props: SampleCardProps): JSX.Element {
  const { card, index } = props;
  const quality = useSelector((state: AppState) => state.settings.cardsQuality);
  const image = useCardImage(card.GrpId, quality);
  const [hoverIn, hoverOut] = useHoverCard(card.GrpId);

  return (
    <div
      className="sample-hand-card"
      style={{ animationDelay: `${index * 85}ms` }}
      title={card.Name}
      onMouseEnter={hoverIn}
      onMouseLeave={hoverOut}
    >
      <div
        className="sample-hand-card-face"
        style={image ? { backgroundImage: `url(${image})` } : undefined}
      />
    </div>
  );
}

/**
 * Seven cards off the top of a shuffled deck.
 *
 * Shows the cards themselves rather than deck-list rows: the question a sample
 * hand answers is "would I keep this", which is a thing you judge by looking at
 * the hand, not by reading names in a table.
 *
 * Re-dealing remounts the cards through a key, so the deal animation replays —
 * without it React reuses the elements, the CSS animation never restarts, and
 * a new hand would appear with no sign that anything happened.
 */
export default function DeckSampleHand(props: { deck: Deck }): JSX.Element {
  const { deck } = props;
  // A stable identity for the deck: DeckView builds a new Deck on every render,
  // so the object itself cannot be a dependency without dealing forever.
  const deckKey = deck.getHash();

  const [hand, setHand] = useState<DbCardDataV2[]>([]);
  const [deals, setDeals] = useState(0);

  const deal = useCallback(() => {
    setHand(getSampleHand(deck));
    setDeals((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckKey]);

  useEffect(() => {
    deal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckKey]);

  return (
    <div className="sample-hand">
      <button type="button" className="sample-hand-shuffle" onClick={deal}>
        <div className="sample-hand-shuffle-icon" />
        Shuffle and draw
      </button>

      {hand.length === 0 ? (
        <div className="sample-hand-empty">
          This deck does not have enough cards to draw a hand.
        </div>
      ) : (
        <div className="sample-hand-cards" key={deals}>
          {hand.map((card, i) => (
            <SampleCard
              // Two copies of a card are the same card; position is what makes
              // each element distinct here.
              // eslint-disable-next-line react/no-array-index-key
              key={`${card.GrpId}-${i}`}
              card={card}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
