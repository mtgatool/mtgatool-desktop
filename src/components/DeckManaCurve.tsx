import { constants, database, Deck } from "mtgatool-shared";

const { MANA_COLORS } = constants;

// Should proably be in constants
const mana: Record<string, string> = {};
mana["0"] = "mana-0";
mana["1"] = "mana-1";
mana["2"] = "mana-2";
mana["3"] = "mana-3";
mana["4"] = "mana-4";
mana["5"] = "mana-5";
mana["6"] = "mana-6";
mana["7"] = "mana-7";
mana["8"] = "mana-8";
mana["9"] = "mana-9";
mana["10"] = "mana-10";
mana["11"] = "mana-11";
mana["12"] = "mana-12";
mana["13"] = "mana-13";
mana["14"] = "mana-14";
mana["15"] = "mana-15";
mana["16"] = "mana-16";
mana["17"] = "mana-17";
mana["18"] = "mana-18";
mana["19"] = "mana-19";
mana["20"] = "mana-20";

const MAX_CMC = 7; // cap at 7+ cmc bucket

function add(a: number, b: number): number {
  return a + b;
}

function getDeckCurve(deck: Deck): number[][] {
  const curve: number[][] = [];
  for (let i = 0; i < MAX_CMC + 1; i += 1) {
    curve[i] = [0, 0, 0, 0, 0, 0];
  }

  if (!deck.getMainboard()) return curve;

  deck
    .getMainboard()
    .get()
    .forEach((card) => {
      const cardObj = database.card(card.id);
      if (!cardObj) return;

      const cmc = Math.min(MAX_CMC, cardObj.cmc);
      if (!cardObj.type.includes("Land")) {
        cardObj.cost.forEach((c: string): void => {
          if (c.includes("w")) curve[cmc][1] += card.quantity;
          if (c.includes("u")) curve[cmc][2] += card.quantity;
          if (c.includes("b")) curve[cmc][3] += card.quantity;
          if (c.includes("r")) curve[cmc][4] += card.quantity;
          if (c.includes("g")) curve[cmc][5] += card.quantity;
        });
        curve[cmc][0] += card.quantity;
      }
    });
  // debugLog(curve);
  return curve;
}

export default function DeckManaCurve(props: {
  className?: string;
  deck: Deck;
}): JSX.Element {
  const { className, deck } = props;
  const manaCounts = getDeckCurve(deck);
  const curveMax = Math.max(...manaCounts.map((v) => v[0]));
  // debugLog("deckManaCurve", manaCounts, curveMax);

  return (
    <div className={`${className} mana-curve-container`}>
      <div className="mana-curve">
        {!!manaCounts &&
          manaCounts.map((cost, i) => {
            const total = cost[0];
            const manaTotal = cost.reduce(add, 0) - total;

            return (
              <div
                className="mana-curve-column"
                // eslint-disable-next-line react/no-array-index-key
                key={`mana_curve_column_${i}`}
                style={{ height: `${(total * 100) / curveMax}%` }}
              >
                <div className="mana-curve-number">
                  {total > 0 ? total : ""}
                </div>
                {MANA_COLORS.map((mc, ind) => {
                  if (ind < 5 && cost[ind + 1] > 0) {
                    return (
                      <div
                        className="mana_curve_column_color"
                        // eslint-disable-next-line react/no-array-index-key
                        key={`mana_curve_column_color_${ind}`}
                        style={{
                          height: `${Math.round(
                            (cost[ind + 1] / manaTotal) * 100
                          )}%`,
                          backgroundColor: mc,
                        }}
                      />
                    );
                  }
                  return <></>;
                })}
              </div>
            );
          })}
      </div>
      <div className="mana-curve-numbers">
        {!!manaCounts &&
          manaCounts.map((_cost, i) => {
            return (
              <div
                className="mana-curve-column-number"
                // eslint-disable-next-line react/no-array-index-key
                key={`mana_curve_column_number_${i}`}
              >
                <div
                  className={`${"mana-s16"} ${mana[`${i}`]}`}
                  style={{ margin: "auto" }}
                >
                  {i === MAX_CMC && (
                    <span style={{ paddingLeft: "20px" }}>+</span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
