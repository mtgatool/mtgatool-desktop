import { Colors, database, DbCardData, InternalDraftv2 } from "mtgatool-shared";
import {
  DRAFT_RANKS,
  DRAFT_RANKS_LOLA,
} from "mtgatool-shared/dist/shared/constants";
import CardTile, { QuantityRank } from "../components/CardTile";
import getCardTypeSort from "../utils/getCardTypeSort";

interface DraftOverlayProps {
  state: InternalDraftv2;
}

function getRank(cardId: number): number {
  const cardObj = database.card(cardId);
  return cardObj?.rank || 0;
}

function compareDraftPicks(
  aCard: DbCardData | undefined,
  bCard: DbCardData | undefined
): -1 | 0 | 1 {
  if (bCard === undefined) {
    return -1;
  }
  if (aCard === undefined) {
    return 1;
  }
  const aColors = new Colors();
  if (aCard.cost) {
    aColors.addFromCost(aCard.cost);
  }
  const bColors = new Colors();
  if (bCard.cost) {
    bColors.addFromCost(bCard.cost);
  }
  const aType = getCardTypeSort(aCard.type);
  const bType = getCardTypeSort(bCard.type);

  const rankDiff =
    aCard.source == 0 ? bCard.rank - aCard.rank : aCard.rank - bCard.rank;
  const colorsLengthDiff = aColors.length - bColors.length;
  const cmcDiff = aCard.cmc - bCard.cmc;
  const typeDiff = aType - bType;
  const localeCompare = aCard.name.localeCompare(bCard.name);
  const compare =
    rankDiff || colorsLengthDiff || cmcDiff || typeDiff || localeCompare;

  if (compare < 0) {
    return -1;
  }
  if (compare > 0) {
    return 1;
  }
  return 0;
}

export default function DraftOverlay(props: DraftOverlayProps) {
  const { state } = props;

  return (
    <>
      {state.packs[state.currentPack][state.currentPick]
        .map((id) => database.card(id))
        .filter((a) => a)
        .sort(compareDraftPicks)
        .map((fullCard) => {
          if (!fullCard) return <></>;
          const rank = getRank(fullCard.id);
          const quantity: QuantityRank = {
            type: "RANK",
            quantity:
              fullCard.source == 0 ? DRAFT_RANKS[rank] : DRAFT_RANKS_LOLA[rank],
          };

          const dfcCard =
            fullCard?.dfcId && fullCard.dfcId !== true
              ? database.card(fullCard.dfcId)
              : undefined;

          return (
            <CardTile
              card={fullCard}
              dfcCard={dfcCard}
              key={`draft-card-tile-${fullCard.id}`}
              indent="a"
              isHighlighted={false}
              isSideboard={false}
              quantity={quantity}
              showWildcards={false}
            />
          );
        })}
    </>
  );
}
