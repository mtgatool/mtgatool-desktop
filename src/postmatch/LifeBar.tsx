interface LifeBarProps {
  player: number[];
  opp: number[];
}

/**
 * Life remaining: one block per life change, each as wide as the life total it
 * records.
 *
 * Both runs start at the centre seam and drain outwards — the player's to the
 * left, the opponent's to the right. Reading outwards from the centre is
 * reading forwards in time, on both sides.
 *
 * That is why the player's run is reversed and the opponent's is not: they are
 * both recorded oldest-first, but only the opponent's is drawn away from the
 * seam in that order.
 *
 * Each side owns exactly half the width and divides its own half between its
 * own blocks, so the seam sits dead centre whatever happened in the game. The
 * comparison the bar makes is therefore within a side — how a player's life
 * fell over time — and not between the two totals, which the Life Lost bar
 * already shows.
 *
 * Only real life changes are drawn; a player who was never touched has no
 * blocks at all, which is exactly what the parser recorded.
 */
export default function LifeBar(props: LifeBarProps): JSX.Element | null {
  const { player, opp } = props;
  if (player.length === 0 && opp.length === 0) return null;

  const sum = (run: number[]): number => run.reduce((a, b) => a + b, 0);

  // A side whose snapshots are all zero has nothing to size blocks by — split
  // its half evenly rather than collapsing the row to nothing.
  const widthIn = (life: number, run: number[]): string => {
    const total = sum(run);
    return total > 0
      ? `${(life / total) * 50}%`
      : `${50 / Math.max(run.length, 1)}%`;
  };

  const block = (
    life: number,
    side: string,
    key: string,
    run: number[]
  ): JSX.Element => (
    <div
      key={key}
      className={`postmatch-life-block ${side}`}
      style={{ width: widthIn(life, run) }}
      title={`${life} life`}
    >
      <span>{life}</span>
    </div>
  );

  return (
    <div className="postmatch-stat">
      <div className="postmatch-stat-title">Life Remaining</div>
      <div className="postmatch-life-bar">
        {[...player]
          .reverse()
          .map((life, i) => block(life, "player", `p-${i}`, player))}
        {opp.map((life, i) => block(life, "opp", `o-${i}`, opp))}
      </div>
    </div>
  );
}
