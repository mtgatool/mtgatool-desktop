import { getRankIndex16, InternalRankData } from "mtgatool-shared";

import formatRank from "../utils/formatRank";

export interface RankSmallProps {
  rank?: InternalRankData;
  rankTier?: string;
  style?: React.CSSProperties;
}

export default function RankSmall(props: RankSmallProps): JSX.Element {
  const { rank: rankData, rankTier, style } = props;

  if (!rankData && !rankTier) return <></>;

  let { rank } = rankData || {};

  if (rankData?.percentile && rankData.percentile !== 0 && !rank)
    rank = "Mythic";

  const getRankStyle = (): React.CSSProperties => {
    return {
      ...(style || {}),
      marginRight: "0px",
      backgroundPosition: `${
        getRankIndex16(rank || rankTier || "Unranked") * -16
      }px 0px`,
    };
  };

  return (
    <div
      style={getRankStyle()}
      title={(rankData ? formatRank(rankData) : rankTier) || "Unranked"}
      className="ranks-16"
    />
  );
}
