import { getRankIndex, InternalRankData } from "mtgatool-shared";

import { CombinedRankInfo } from "../../../background/onLabel/InEventGetCombinedRankInfo";
import formatRank from "../../../utils/formatRank";

interface TopRankProps {
  rank: CombinedRankInfo | null;
  rankClass: string;
  type: "constructed" | "limited";
}

export default function UserRank(props: TopRankProps): JSX.Element {
  const { rank, rankClass, type } = props;

  if (rank == null) {
    // No rank badge, default to beginner and remove interactions
    const rankStyle = {
      backgroundPosition: "0px 0px",
    };
    return (
      <div className="item">
        <div style={rankStyle} className={rankClass} />
      </div>
    );
  }

  let internalRank: InternalRankData = {
    rank: rank.constructedClass,
    tier: rank.constructedLevel,
    step: rank.constructedStep,
    won: rank.constructedMatchesWon,
    lost: rank.constructedMatchesLost,
    drawn: rank.constructedMatchesDrawn,
    percentile: rank.constructedPercentile,
    leaderboardPlace: rank.constructedLeaderboardPlace,
    seasonOrdinal: rank.constructedSeasonOrdinal,
  };

  if (type === "limited") {
    internalRank = {
      rank: rank.limitedClass,
      tier: rank.limitedLevel,
      step: rank.limitedStep,
      won: rank.limitedMatchesWon,
      lost: rank.limitedMatchesLost,
      drawn: rank.limitedMatchesDrawn,
      percentile: rank.limitedPercentile,
      leaderboardPlace: rank.limitedLeaderboardPlace,
      seasonOrdinal: rank.limitedSeasonOrdinal,
    };
  }

  const propTitle = formatRank(internalRank);
  const rankStyle = {
    backgroundPosition: `${
      getRankIndex(internalRank.rank, internalRank.tier) * -48
    }px 0px`,
  };

  return (
    <div className="user-rank">
      <div className="">
        <div style={rankStyle} className={rankClass} />
      </div>
      <div
        style={{
          textAlign: "left",
          lineHeight: "48px",
          marginRight: "16px",
        }}
      >
        {propTitle}
      </div>
    </div>
  );
}
