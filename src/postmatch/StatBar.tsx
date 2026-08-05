interface StatBarProps {
  title: string;
  player: number;
  opp: number;
}

/**
 * One diverging bar: the player's share growing from the left, the
 * opponent's from the right, each labelled with its own total.
 *
 * A zero on both sides would divide by zero, so it falls back to an even
 * split — a match where neither player gained life should read as 0 | 0, not
 * as a blank row.
 */
export default function StatBar(props: StatBarProps): JSX.Element {
  const { title, player, opp } = props;
  const total = player + opp;
  const playerPct = total > 0 ? (player / total) * 100 : 50;

  return (
    <div className="postmatch-stat">
      <div className="postmatch-stat-title">{title}</div>
      <div className="postmatch-stat-bar">
        <div
          className="postmatch-stat-fill player"
          style={{ width: `${playerPct}%` }}
        >
          <span className="postmatch-stat-value">{player}</span>
        </div>
        <div
          className="postmatch-stat-fill opp"
          style={{ width: `${100 - playerPct}%` }}
        >
          <span className="postmatch-stat-value">{opp}</span>
        </div>
      </div>
    </div>
  );
}
