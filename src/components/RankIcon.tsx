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
  const { rank, tier, style, step, format, percentile, leaderboardPlace } =
    props;
  const rankIndex = getRankIndex(rank, tier);

  const newStyle = { ...{ width: "48px", height: "48px" }, ...style };

  const rankStyle = {
    backgroundPosition: `${rankIndex * -48}px 0px`,
  };

  const rankClass =
    !format || format == "constructed" ? "constructed-rank" : "limited-rank";

  const mythicRankTitle =
    rank +
    (leaderboardPlace == 0 ? ` ${percentile}%` : ` #${leaderboardPlace}`);
  const rankTitle = rank == "Mythic" ? mythicRankTitle : `${rank} ${tier}`;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        title={rankTitle}
        className={rankClass}
        style={{ ...rankStyle, ...newStyle }}
      />
      {step !== undefined ? (
        <div className="rank-bullets">
          {[0, 0, 0, 0, 0, 0].fill(1, 0, step).map((v, i) => {
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
