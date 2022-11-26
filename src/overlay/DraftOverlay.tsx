import {
  Colors,
  database,
  DbCardDataV2,
  InternalDraftv2,
} from "mtgatool-shared";
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

function getRank(cardId: number): number | undefined {
  const cardObj = database.card(cardId);
  if (cardObj?.RankData && cardObj?.RankData.rankSource !== -1) {
    return cardObj.RankData.rank;
  }

  return undefined;
}

function compareDraftPicks(
  aCard: DbCardDataV2 | undefined,
  bCard: DbCardDataV2 | undefined
): -1 | 0 | 1 {
  if (bCard === undefined) {
    return -1;
  }
  if (aCard === undefined) {
    return 1;
  }
  const aColors = new Colors();
  if (aCard.ManaCost) {
    aColors.addFromCost(aCard.ManaCost);
  }
  const bColors = new Colors();
  if (bCard.ManaCost) {
    bColors.addFromCost(bCard.ManaCost);
  }
  const aType = getCardTypeSort(aCard.Types);
  const bType = getCardTypeSort(bCard.Types);

  let aRankVal = 0;
  if (aCard.RankData.rankSource == 0) aRankVal = aCard.RankData.rank;
  if (aCard.RankData.rankSource == 1) aRankVal = aCard.RankData.rank;
  if (aCard.RankData.rankSource == 2) aRankVal = aCard.RankData.rank;

  let bRankVal = 0;
  if (bCard.RankData.rankSource == 0) bRankVal = bCard.RankData.rank;
  if (bCard.RankData.rankSource == 1) bRankVal = bCard.RankData.rank;
  if (bCard.RankData.rankSource == 2) bRankVal = bCard.RankData.rank;

  const rankDiff = aRankVal - bRankVal;

  const colorsLengthDiff = aColors.length - bColors.length;
  const cmcDiff = aCard.Cmc - bCard.Cmc;
  const typeDiff = aType - bType;
  const localeCompare = aCard.Name.localeCompare(bCard.Name);
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
          const rank = getRank(fullCard.GrpId);
          const quantity: QuantityRank = {
            type: "RANK",
            quantity:
              fullCard.RankData.rankSource == 0
                ? DRAFT_RANKS[rank || 0]
                : DRAFT_RANKS_LOLA[rank || 0],
          };

          const dfcCard =
            fullCard?.LinkedFaceGrpIds.length > 0
              ? database.card(fullCard.LinkedFaceGrpIds[0])
              : undefined;

          return (
            <div
              className="draft-card-tile-container"
              key={`draft-card-tile-${fullCard.GrpId}`}
            >
              {Object.keys(votes).length > 0 && (
                <div
                  style={{
                    color: fullCard.GrpId === mostVoted ? "var(--color-g)" : "",
                    fontFamily:
                      fullCard.GrpId === mostVoted
                        ? "var(--main-font-name-bold-it)"
                        : "",
                  }}
                  className="draft-vote"
                >
                  {currentVotes[fullCard.GrpId] || 0}
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
