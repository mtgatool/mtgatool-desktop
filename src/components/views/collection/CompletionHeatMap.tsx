/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-props-no-spreading */

import { CARD_RARITIES, COLORS_LONG } from "../../../constants";
import useHoverCard from "../../../hooks/useHoverCard";
import { CardStats } from "./collectionStats";

type ColorData = { [key: string]: CardStats[] };
type CardData = ColorData[];

const compCard: string[] = [];
compCard[0] = "completion-table-card-n0";
compCard[1] = "completion-table-card-n1";
compCard[2] = "completion-table-card-n2";
compCard[3] = "completion-table-card-n3";
compCard[4] = "completion-table-card-n4";

const manaClasses: Record<string, string> = {
  white: "mana-w",
  blue: "mana-u",
  black: "mana-b",
  red: "mana-r",
  green: "mana-g",
  colorless: "mana-c",
  multi: "mana-multi",
};

const compRarity: Record<string, string> = {
  common: "completion-table-rarity-title-common",
  uncommon: "completion-table-rarity-title-uncommon",
  rare: "completion-table-rarity-title-rare",
  mythic: "completion-table-rarity-title-mythic",
};

function CardCell({
  card,
  color,
  rarityIndex,
  index,
}: {
  card: CardStats;
  color: number;
  rarityIndex: number;
  index: number;
}): JSX.Element {
  const [hoverIn, hoverOut] = useHoverCard(card.id);
  return (
    <div
      key={index}
      className={`completion-table-card ${compCard[Math.min(card.owned, 4)]} ${
        card.wanted > 0 ? "wanted" : ""
      }`}
      onMouseEnter={hoverIn}
      onMouseLeave={hoverOut}
      style={{
        gridArea: `${index + 3} / ${color * 5 + 1 + rarityIndex} / auto / ${
          color * 5 + 1 + rarityIndex
        }`,
      }}
    >
      {Math.min(card.owned, 4)}
    </div>
  );
}

function RarityColumn({
  colorData,
  color,
  rarityCode,
}: {
  // Optional, and already treated that way below: a colour with no cards in
  // the set has no entry. Declaring it required only hid that from the
  // compiler.
  colorData?: ColorData;
  color: number;
  rarityCode: string;
}): JSX.Element {
  const rarityIndex = CARD_RARITIES.filter(
    (r) => r !== "land" && r !== "token"
  ).indexOf(rarityCode as any);
  const rarity = rarityCode.toLowerCase();
  const cardsArray = colorData && colorData[rarity] ? colorData[rarity] : [];
  return (
    <>
      <div
        className={`${compRarity[rarity]} completion-table-rarity-title`}
        title={rarity}
        style={{
          gridArea: `2 / ${color * 5 + 1 + rarityIndex} / auto / ${
            color * 5 + 1 + rarityIndex
          }`,
        }}
      />
      {cardsArray.map((card, index) => {
        const props = {
          card,
          color,
          rarityIndex,
          index,
        };
        return <CardCell key={index} {...props} />;
      })}
    </>
  );
}

function ColorColumn({
  cardData,
  colorCode,
  color,
}: {
  cardData?: CardData;
  colorCode: string;
  color: number;
}): JSX.Element {
  // A little hacky to use "c + 1"..
  const colorIndex = color + 1;
  // Defended rather than assumed: a set with no statistics has nothing here,
  // and indexing it threw out of the whole collection view. The columns below
  // already cope with a colour that has no cards, so an empty grid is the
  // honest answer.
  const colorData = cardData ? cardData[colorIndex] : undefined;
  return (
    <>
      <div
        key={color}
        className={`${"completion-table-color-title"} ${
          manaClasses[colorCode]
        }`}
        style={{
          gridArea: `1 / ${color * 5 + 1} / auto / ${color * 5 + 6}`,
        }}
      />
      {CARD_RARITIES.filter((rarity) => rarity !== "land").map((rarityCode) => {
        const props = {
          colorData,
          color,
          rarityCode,
        };
        return <RarityColumn key={rarityCode} {...props} />;
      })}
    </>
  );
}

export default function CompletionHeatMap({
  cardData,
}: {
  cardData?: CardData;
}): JSX.Element {
  return (
    <>
      <div className="completion-table">
        {COLORS_LONG.map((code, color) => {
          return (
            <ColorColumn
              key={color}
              cardData={cardData}
              colorCode={code}
              color={color}
            />
          );
        })}
      </div>

      {/* The cells carry their count as text, but the colour is what the eye
          reads first, and a ramp says nothing without its ends named. */}
      <div className="completion-table-legend">
        <span>none</span>
        {[0, 1, 2, 3, 4].map((owned) => (
          <div
            key={owned}
            className={`completion-table-legend-swatch ${compCard[owned]}`}
            title={`${owned} copies owned`}
          />
        ))}
        <span>playset</span>
      </div>
    </>
  );
}
