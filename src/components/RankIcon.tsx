import { getRankIndex } from "mtgatool-shared";

export interface RankIconProps {
  style?: React.CSSProperties;
  rank: string;
  tier: number;
  step?: number;
  percentile?: number;
  leaderboardPlace?: number;
  format: "constructed" | "limited";
}

export default function RankIcon(props: RankIconProps): JSX.Element {
  const { tier, style, step, format, percentile, leaderboardPlace } = props;

  let { rank } = props;

  if (percentile !== 0 && !rank) rank = "Mythic";

  const rankIndex = getRankIndex(rank, tier);

  const newStyle = { ...{ width: "48px", height: "48px" }, ...style };

  const rankStyle = {
    backgroundPosition: `${rankIndex * -48}px 0px`,
  };

  const rankClass =
    !format || format == "constructed" ? "constructed-rank" : "limited-rank";

  const mythicRankTitle =
    rank +
    (leaderboardPlace == 0
      ? ` ${(percentile || 0).toFixed(2)}%`
      : ` #${leaderboardPlace}`);
  const rankTitle = rank == "Mythic" ? mythicRankTitle : `${rank} ${tier}`;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        title={rankTitle}
        className={rankClass}
        style={{ ...rankStyle, ...newStyle }}
      />
      {step !== undefined && rank !== "Mythic" ? (
        <div className="rank-bullets">
          {[0, 0, 0, 0, 0, 0]
            .fill(1, 0, rank === "Mythic" ? 6 : step)
            .map((v, i) => {
              return (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={`rank-bullet-${rank}-${i}`}
                  className={v ? "rank-bullet-light" : "rank-bullet-dark"}
                />
              );
            })}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
