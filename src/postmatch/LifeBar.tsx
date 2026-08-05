interface LifeBarProps {
  player: number[];
  opp: number[];
}

/**
 * Life remaining: one block per life change, the player's run then the
 * opponent's, each block as wide as the life total it records.
 *
 * So a game that stayed level splits down the middle, and a player taken from
 * 20 to 0 in one hit contributes a single wide block followed by nothing —
 * the shape of the game is legible without reading a number.
 *
 * Only real life changes are drawn; a player who was never touched has no
 * blocks at all, which is exactly what the parser recorded.
 */
export default function LifeBar(props: LifeBarProps): JSX.Element | null {
  const { player, opp } = props;
  if (player.length === 0 && opp.length === 0) return null;

  const grand =
    player.reduce((a, b) => a + b, 0) + opp.reduce((a, b) => a + b, 0);

  // Every snapshot is zero (both players dead at 0) — nothing to size blocks
  // by, so fall back to equal widths rather than collapsing the row.
  const even = grand === 0;
  const count = player.length + opp.length;
  const widthFor = (life: number): string =>
    even ? `${100 / count}%` : `${(life / grand) * 100}%`;

  const block = (life: number, side: string, key: string): JSX.Element => (
    <div
      key={key}
      className={`postmatch-life-block ${side}`}
      style={{ width: widthFor(life) }}
      title={`${life} life`}
    >
      <span>{life}</span>
    </div>
  );

  return (
    <div className="postmatch-stat">
      <div className="postmatch-stat-title">Life Remaining</div>
      <div className="postmatch-life-bar">
        {player.map((life, i) => block(life, "player", `p-${i}`))}
        {opp.map((life, i) => block(life, "opp", `o-${i}`))}
      </div>
    </div>
  );
}
