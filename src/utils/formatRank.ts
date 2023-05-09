import { InternalRankData } from "mtgatool-shared";

// pass in playerData.constructed / limited / historic objects
export default function formatRank(rank: InternalRankData): string {
  if (rank.rank === "Mythic") {
    if (rank.leaderboardPlace) {
      return `Mythic #${rank.leaderboardPlace}`;
    }
    if (rank.percentile) {
      return `Mythic ${rank.percentile.toFixed(2)}%`;
    }
  }

  if (!rank.rank) return "-";

  return `${rank.rank} ${rank.tier}`;
}
