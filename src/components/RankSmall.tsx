import { getRankIndex16, InternalRankData } from "mtgatool-shared";
import formatRank from "../utils/formatRank";

export interface RankSmallProps {
  rank?: InternalRankData;
  rankTier?: string;
  style?: React.CSSProperties;
}

export default function RankSmall(props: RankSmallProps): JSX.Element {
  const { rank, rankTier, style } = props;

  const getRankStyle = (): React.CSSProperties => {
    return {
      ...(style || {}),
      marginRight: "0px",
      backgroundPosition: `${
        getRankIndex16(rank?.rank || rankTier || "Unranked") * -16
      }px 0px`,
    };
  };

  return (
    <div
      style={getRankStyle()}
      title={(rank ? formatRank(rank) : rankTier) || "Unranked"}
      className="ranks-16"
    />
  );
}
