/* eslint-disable react/no-array-index-key */

import { MANA_COLORS } from "../constants";
import database from "../utils/mtga/database";
import Deck from "../utils/mtga/deck";

const MAX_CMC = 7; // cap at 7+ cmc bucket

/** Index into MANA_COLORS, in WUBRG order. */
const COLOR_KEYS = ["w", "u", "b", "r", "g"] as const;

interface Bucket {
  /** Cards in this bucket. The bar's height. */
  cards: number;
  /** Coloured pip counts, WUBRG. Sizes the segments within the bar. */
  pips: number[];
  /** Cards here with no coloured pip at all — artifacts, generic costs. */
  colorless: number;
}

function emptyBucket(): Bucket {
  return { cards: 0, pips: [0, 0, 0, 0, 0], colorless: 0 };
}

function getDeckCurve(deck: Deck): { buckets: Bucket[]; avg: number } {
  const buckets: Bucket[] = [];
  for (let i = 0; i <= MAX_CMC; i += 1) buckets[i] = emptyBucket();

  let spells = 0;
  let cmcTotal = 0;

  deck
    .getMainboard()
    .get()
    .forEach((card) => {
      const cardObj = database.card(card.id);
      if (!cardObj) return;
      if (cardObj.Types.includes("Land")) return;

      const bucket = buckets[Math.min(MAX_CMC, cardObj.Cmc)];
      bucket.cards += card.quantity;
      spells += card.quantity;
      cmcTotal += cardObj.Cmc * card.quantity;

      let colored = false;
      cardObj.ManaCost.forEach((symbol: string) => {
        COLOR_KEYS.forEach((key, i) => {
          if (symbol.includes(key)) {
            bucket.pips[i] += card.quantity;
            colored = true;
          }
        });
      });
      if (!colored) bucket.colorless += card.quantity;
    });

  return { buckets, avg: spells ? cmcTotal / spells : 0 };
}

/**
 * The deck's spells by mana value, each bar split by the colours it costs.
 *
 * Bars are capped rather than filling their slot, and the count sits above the
 * cap in ordinary text: it used to be printed inside the bar in the surface
 * colour with a light outline, which is why it was hard to read against every
 * fill it landed on.
 */
export default function DeckManaCurve(props: {
  className?: string;
  deck: Deck;
}): JSX.Element {
  const { className, deck } = props;
  const { buckets, avg } = getDeckCurve(deck);
  const max = Math.max(...buckets.map((b) => b.cards), 1);
  const spells = buckets.reduce((acc, b) => acc + b.cards, 0);

  return (
    <div className={`${className || ""} mana-curve-container`}>
      <div className="mana-curve">
        {buckets.map((bucket, cmc) => {
          const pipTotal =
            bucket.pips.reduce((a, b) => a + b, 0) + bucket.colorless;

          // Segments in WUBRG order, then the colourless remainder. Anything
          // with no pips at all still needs a body, so it reads as one bar.
          const segments = COLOR_KEYS.map((key, i) => ({
            key,
            color: MANA_COLORS[i],
            share: pipTotal ? bucket.pips[i] / pipTotal : 0,
          }))
            .filter((s) => s.share > 0)
            .concat(
              bucket.colorless > 0 || pipTotal === 0
                ? [
                    {
                      key: "c" as any,
                      color: MANA_COLORS[5],
                      share: pipTotal ? bucket.colorless / pipTotal : 1,
                    },
                  ]
                : []
            );

          const label = cmc === MAX_CMC ? `${MAX_CMC}+` : `${cmc}`;
          const title = `${bucket.cards} card${
            bucket.cards === 1 ? "" : "s"
          } at mana value ${label}`;

          return (
            <div className="mana-curve-slot" key={`curve-${cmc}`} title={title}>
              <div className="mana-curve-value">
                {bucket.cards > 0 ? bucket.cards : ""}
              </div>
              <div
                className="mana-curve-bar"
                style={{ height: `${(bucket.cards / max) * 100}%` }}
              >
                {segments.map((segment) => (
                  <div
                    key={`curve-${cmc}-${segment.key}`}
                    className="mana-curve-segment"
                    style={{
                      height: `${segment.share * 100}%`,
                      backgroundColor: segment.color,
                    }}
                  />
                ))}
              </div>
              <div className="mana-curve-tick">{label}</div>
            </div>
          );
        })}
      </div>
      <div className="mana-curve-summary">
        {spells} spell{spells === 1 ? "" : "s"} · average mana value{" "}
        {avg.toFixed(2)}
      </div>
    </div>
  );
}
