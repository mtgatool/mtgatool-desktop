import { useEffect, useState } from "react";

import CardTile, { QuantityRank } from "../components/CardTile";
import DeckManaCurve from "../components/DeckManaCurve";
import ManaCost from "../components/ManaCost";
import { DRAFT_RANKS, DRAFT_RANKS_LOLA } from "../constants";
import { getData } from "../data/store";
import { useCards } from "../hooks/useCard";
import { Cards, DbCardDataV2, DraftRatings, InternalDraftv2 } from "../types";
import { DbCardsData, DbDraftVote } from "../types/dbTypes";
import getCardTypeSort from "../utils/getCardTypeSort";
import getLocalSetting from "../utils/getLocalSetting";
import Colors from "../utils/mtga/colors";
import database from "../utils/mtga/database";
import Deck from "../utils/mtga/deck";

interface DraftOverlayProps {
  state: InternalDraftv2;
  votes: Record<string, DbDraftVote>;
  /** Live 17lands numbers; when present they beat the baked-in RankData. */
  ratings?: DraftRatings;
  /** Color share of the picks so far, at the top of the overlay. */
  showStats?: boolean;
}

const STAT_COLORS: { code: number; token: string; letter: string }[] = [
  { code: 1, token: "--color-w", letter: "W" },
  { code: 2, token: "--color-u", letter: "U" },
  { code: 3, token: "--color-b", letter: "B" },
  { code: 4, token: "--color-r", letter: "R" },
  { code: 5, token: "--color-g", letter: "G" },
];

/**
 * Share of each color among the picked cards (a multicolor card counts once
 * per color). Rendered as a stacked bar plus per-color percentages — the
 * at-a-glance "what am I actually drafting" readout.
 */
function DraftColorStats(props: { pickedCards: number[] }): JSX.Element {
  const { pickedCards } = props;
  const cards = useCards(pickedCards);

  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  cards.forEach((card) => {
    if (!card?.ManaCost) return;
    const colors = new Colors();
    colors.addFromCost(card.ManaCost);
    colors.get().forEach((c) => {
      if (counts[c] !== undefined) counts[c] += 1;
    });
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (total === 0) return <></>;

  const shares = STAT_COLORS.map((c) => ({
    ...c,
    pct: Math.round((counts[c.code] / total) * 100),
  })).filter((c) => c.pct > 0);

  return (
    <div className="draft-color-stats">
      <DeckManaCurve
        className="draft-curve-compact"
        deck={
          new Deck(
            {},
            pickedCards.map((id) => ({ id, quantity: 1 }))
          )
        }
      />
      <div className="stats-bar">
        {shares.map((c) => (
          <div
            key={`stat-seg-${c.letter}`}
            className="seg"
            style={{
              width: `${(counts[c.code] / total) * 100}%`,
              backgroundColor: `var(${c.token})`,
            }}
          />
        ))}
      </div>
      <div className="stats-legend">
        {shares.map((c) => (
          // "draft-legend-mana", not "mana-16": that class is ALSO the {16}
          // generic-cost symbol (grey circle with a 16), and its background
          // wins the cascade over the color symbol's.
          <div key={`stat-leg-${c.letter}`} className="entry">
            <ManaCost className="draft-legend-mana" colors={[c.code]} />
            {`${c.pct}%`}
          </div>
        ))}
      </div>
    </div>
  );
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
  const { state, votes, ratings, showStats } = props;

  // Card reads below are synchronous cache hits; in the overlay window the
  // database is a proxy to the background window, so the pack has to be
  // fetched first — this re-renders when the cards land.
  useCards(state.packs[state.currentPack][state.currentPick] || []);

  // Owned copies, straight from the shared KV — the UPSERT_DB_CARDS broadcast
  // fires at boot, long before this window exists.
  const [owned, setOwned] = useState<Cards | null>(null);
  useEffect(() => {
    const uuid = getLocalSetting("playerId") || "default";
    getData<DbCardsData>(`${uuid}-cards`, true).then((data) => {
      if (data?.cards) setOwned(data.cards);
    });
  }, []);

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
      {showStats && <DraftColorStats pickedCards={state.pickedCards} />}
      {state.packs[state.currentPack][state.currentPick]
        .map((id) => database.card(id))
        .filter((a) => a)
        .sort((a, b) => {
          // Best win rate first when live ratings are in; otherwise the
          // baked-in rank ordering.
          const aR = a && ratings?.[a.GrpId];
          const bR = b && ratings?.[b.GrpId];
          if (aR || bR) {
            return (bR?.gihwr ?? 0) - (aR?.gihwr ?? 0);
          }
          return compareDraftPicks(a, b);
        })
        .map((fullCard) => {
          if (!fullCard) return <></>;
          const liveRating = ratings?.[fullCard.GrpId];
          const rank = getRank(fullCard.GrpId);
          const bakedGrade =
            fullCard.RankData.rankSource == 0
              ? DRAFT_RANKS[rank || 0]
              : DRAFT_RANKS_LOLA[rank || 0];
          const ownedCount = Math.min(4, (owned && owned[fullCard.GrpId]) || 0);
          const quantity: QuantityRank = {
            type: "RANK",
            quantity: liveRating ? liveRating.grade : bakedGrade,
            owned: owned ? ownedCount : undefined,
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
