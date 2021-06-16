import { useSelector } from "react-redux";
import { cardHasType, DbCardData } from "mtgatool-shared";
import { AppState } from "../redux/stores/rendererStore";

interface OwnershipProps {
  owned: number;
  acquired: number;
  wanted: number;
}

function OwnershipInfinity(props: OwnershipProps): JSX.Element {
  const { owned, acquired, wanted } = props;
  let title = `${owned > 0 ? "∞" : "0"} copies in collection`;
  if (acquired) {
    title += ` (∞ recent)`;
  }
  let color = "inventory-card-infinity-gray";
  if (wanted > 0) color = "inventory-card-infinity-blue";
  if (owned > 0) color = "inventory-card-infinity-green";
  if (acquired > 0) color = "inventory-card-infinity-orange";
  return <div className={color} title={title} />;
}

export const OwnershipSymbol = (props: {
  style?: React.CSSProperties;
  className?: string;
  title?: string;
}): JSX.Element => {
  const { style, className, title } = props;

  return <div className={className || ""} style={style} title={title} />;
};

interface OwnershipStarProps extends OwnershipProps {
  owned: number;
  acquired: number;
  wanted: number;
  copyIndex: number;
  title: string;
}

function OwnershipStar(props: OwnershipStarProps): JSX.Element {
  const { owned, acquired, wanted, copyIndex, title } = props;
  let color = "inventory-card-quantity-gray"; // default unowned
  if (copyIndex < owned) {
    color = "inventory-card-quantity-green"; // owned copy
  }
  if (copyIndex >= owned - acquired && copyIndex < owned) {
    color = "inventory-card-quantity-orange"; // owned and newly acquired copy
  }
  if (copyIndex >= owned && copyIndex < owned + wanted) {
    color = "inventory-card-quantity-blue"; // not owned and wanted copy
  }
  return <OwnershipSymbol className={color} title={title} />;
}

function MultiCardOwnership(props: OwnershipProps): JSX.Element {
  const { owned, acquired, wanted } = props;
  let title = `${owned}/4 copies in collection`;
  if (acquired !== 0) {
    title += ` (${acquired} recent)`;
  }
  if (wanted !== 0) {
    title += `, ${wanted} more wanted`;
  }
  const possibleCopiesIndex = [0, 1, 2, 3];
  return (
    <>
      {possibleCopiesIndex.map((copyIndex) => (
        <OwnershipStar
          acquired={acquired}
          copyIndex={copyIndex}
          key={copyIndex}
          owned={owned}
          wanted={wanted}
          title={title}
        />
      ))}
    </>
  );
}

export default function OwnershipStars(props: {
  card: DbCardData;
  wanted?: number;
}): JSX.Element {
  const { card, wanted } = props;
  const { cards, cardsNew } = useSelector((state: AppState) => state.mainData);
  if (!card) {
    return <></>;
  }
  let owned = cards[card.id] ?? 0;
  const acquired = cardsNew[card.id] ?? 0;
  const isWanted = wanted ?? 0;

  const infinitePlaysetCards = [69172, 67306, 76490];

  const isbasic =
    cardHasType(card, "Basic Land") || cardHasType(card, "Basic Snow Land");
  let Renderer = isbasic ? OwnershipInfinity : MultiCardOwnership;

  if (infinitePlaysetCards.includes(card.id) && owned == 4) {
    Renderer = OwnershipInfinity;
  }
  if (card.rarity == "token") {
    owned = 4;
    Renderer = OwnershipInfinity;
  }
  return <Renderer owned={owned} acquired={acquired} wanted={isWanted} />;
}
