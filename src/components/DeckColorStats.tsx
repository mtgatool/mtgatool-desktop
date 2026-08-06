import { MANA_COLORS } from "../constants";
import { ColorsAmmount } from "../types";
import getDeckColorsAmmount from "../utils/getDeckColorsAmmount";
import getDeckLandsAmmount from "../utils/getDeckLandsAmmount";
import Deck from "../utils/mtga/deck";

/** WUBRG, matching MANA_COLORS' order. */
const COLORS = [
  { key: "w", icon: "mana-w", name: "White" },
  { key: "u", icon: "mana-u", name: "Blue" },
  { key: "b", icon: "mana-b", name: "Black" },
  { key: "r", icon: "mana-r", name: "Red" },
  { key: "g", icon: "mana-g", name: "Green" },
] as const;

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

/**
 * How the deck's colours are split, by what it costs and by what it can make.
 *
 * This replaced two pie charts sitting side by side. A pie is the wrong form
 * here: the question is not "what are the parts of a whole" so much as "is my
 * mana base a match for my costs", and comparing two pies wedge by wedge is
 * exactly the comparison a pie is worst at. The same two numbers per colour,
 * on a shared scale, can be read down the column instead.
 */
export default function DeckColorStats(props: { deck: Deck }): JSX.Element {
  const { deck } = props;

  const symbols: ColorsAmmount = getDeckColorsAmmount(deck);
  const sources: ColorsAmmount = getDeckLandsAmmount(deck);

  const present = COLORS.filter(
    (c) => symbols[c.key] > 0 || sources[c.key] > 0
  );

  if (present.length === 0) {
    return (
      <div className="deck-colors-empty">
        This deck has no coloured mana symbols.
      </div>
    );
  }

  return (
    <>
      <div className="deck-colors-grid">
        {present.map((color, i) => {
          const symbolCount = symbols[color.key];
          const sourceCount = sources[color.key];
          const symbolPct = pct(symbolCount, symbols.total);
          const sourcePct = pct(sourceCount, sources.total);
          const hue = MANA_COLORS[i];

          return (
            <div className="deck-color-stat" key={color.key}>
              <div className={`mana-s20 ${color.icon} deck-color-icon`} />
              <div className="deck-color-name">{color.name}</div>

              <div className="deck-color-figure">{symbolPct}%</div>
              <div className="deck-color-sub">
                {symbolCount} of {symbols.total} symbols
              </div>

              {/* Two meters on one scale, so cost and mana base line up
                  vertically and a mismatch is visible without arithmetic. */}
              <div
                className="deck-color-meter"
                title={`${symbolPct}% of mana symbols`}
              >
                <div
                  className="deck-color-meter-fill"
                  style={{ width: `${symbolPct}%`, backgroundColor: hue }}
                />
              </div>
              <div
                className="deck-color-meter"
                title={`${sourcePct}% of mana sources`}
              >
                <div
                  className="deck-color-meter-fill dim"
                  style={{ width: `${sourcePct}%`, backgroundColor: hue }}
                />
              </div>
              <div className="deck-color-sub">{sourcePct}% of sources</div>
            </div>
          );
        })}
      </div>
      <div className="deck-colors-note">
        Top bar is the share of mana symbols the deck costs; bottom is the share
        of its lands that make that colour. A card costing two colours counts
        for both, so the shares do not add to 100%.
      </div>
    </>
  );
}
