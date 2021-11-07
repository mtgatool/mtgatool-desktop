import { Colors, database, DbCardData, InternalDraftv2 } from "mtgatool-shared";
import {
  DRAFT_RANKS,
  DRAFT_RANKS_LOLA,
} from "mtgatool-shared/dist/shared/constants";
import CardTile, { QuantityRank } from "../components/CardTile";

import { DbDraftVote } from "../types/dbTypes";
import getCardTypeSort from "../utils/getCardTypeSort";

interface DraftOverlayProps {
  state: InternalDraftv2;
  votes: Record<string, DbDraftVote>;
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
  const { state, votes } = props;

  const currentVotes: Record<number, number> = {};
  let mostVoted = -1;

  Object.keys(votes || {})
    .filter((key) => key.endsWith(`-${state.currentPack}-${state.currentPick}`))
    .forEach((key) => {
      const keyData = votes[key];
      if (keyData) {
        const grpId = keyData.vote || 0;
        if (!currentVotes[grpId]) currentVotes[grpId] = 0;
        currentVotes[grpId] += 1;
        if (currentVotes[grpId] > (currentVotes[mostVoted] || 0)) {
          mostVoted = grpId;
        }
      }
    });

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
            <div
              className="draft-card-tile-container"
              key={`draft-card-tile-${fullCard.id}`}
            >
              {Object.keys(votes).length > 0 && (
                <div
                  style={{
                    color: fullCard.id === mostVoted ? "var(--color-g)" : "",
                    fontFamily:
                      fullCard.id === mostVoted
                        ? "var(--main-font-name-bold-it)"
                        : "",
                  }}
                  className="draft-vote"
                >
                  {currentVotes[fullCard.id] || 0}
                </div>
              )}
              <CardTile
                card={fullCard}
                dfcCard={dfcCard}
                indent="a"
                isHighlighted={false}
                isSideboard={false}
                quantity={quantity}
                showWildcards={false}
              />
            </div>
          );
        })}
    </>
  );
}
