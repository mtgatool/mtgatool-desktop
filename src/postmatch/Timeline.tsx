import { Heat } from "../types";

interface TimelineProps {
  heat: Heat[];
  playerSeat: number;
  totalTurns: number;
}

const PHASE_LABEL: Record<string, string> = {
  Phase_Beginning: "Beginning",
  Phase_Main1: "First Main",
  Phase_Combat: "Combat",
  Phase_Main2: "Second Main",
  Phase_Ending: "Ending",
};

/**
 * The match as a sequence of activity: one column per (seat, turn, phase)
 * the parser recorded, the player's growing up from the centre line and the
 * opponent's down.
 *
 * Column height is the number of things that player did in that phase —
 * mana paid, life changed, spells cast, damage dealt — so a turn where
 * somebody comboed off is visibly taller than a turn where they passed.
 *
 * Turn boundaries are drawn as separators rather than as an axis: the
 * interesting comparison is between adjacent phases, and a full axis at this
 * width would be unreadable.
 */
export default function Timeline(props: TimelineProps): JSX.Element | null {
  const { heat, playerSeat, totalTurns } = props;
  if (!heat || heat.length === 0) return null;

  const max = Math.max(...heat.map((h) => h.value), 1);

  return (
    <div className="postmatch-stat">
      <div className="postmatch-stat-title">
        Timeline <span className="postmatch-dim">({totalTurns} turns)</span>
      </div>
      <div className="postmatch-timeline">
        <div className="postmatch-timeline-axis" />
        {heat.map((h, i) => {
          const isPlayer = h.seat === playerSeat;
          const height = (h.value / max) * 100;
          const newTurn = i > 0 && heat[i - 1].turn !== h.turn;
          const phase = PHASE_LABEL[h.phase] || h.phase;

          return (
            <div
              // Nothing in a heat entry is unique — the same seat can act in
              // the same phase of the same turn more than once — so position
              // is the only stable identity here.
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className={`postmatch-timeline-col${
                newTurn ? " turn-start" : ""
              }`}
              title={`Turn ${h.turn} — ${phase} — ${h.value} action${
                h.value === 1 ? "" : "s"
              }`}
            >
              <div
                className={`postmatch-timeline-bar ${
                  isPlayer ? "player" : "opp"
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
