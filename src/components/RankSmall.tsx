import { getRankIndex16 } from "mtgatool-shared";
import formatRank from "../utils/formatRank";

interface RankSmallProps {
  rank?: any | string;
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
        getRankIndex16(rankTier || rank.rank) * -16
      }px 0px`,
    };
  };

  return (
    <div
      style={getRankStyle()}
      title={rankTier || formatRank(rank)}
      className="ranks16"
    />
  );
}
