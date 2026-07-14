import { useMemo } from "react";

import Section from "../../ui/Section";
import { MatchData } from "../history/convertDbMatchData";

interface ViewTimelineProps {
  matchesData: MatchData[];
}

// Rank class -> ordinal (matches the reader's rankClass ordering).
const RANK_ORDER: Record<string, number> = {
  Unranked: -1,
  Beginner: 0,
  Bronze: 1,
  Silver: 2,
  Gold: 3,
  Platinum: 4,
  Diamond: 5,
  Mythic: 6,
};
const RANK_NAMES = [
  "Beginner",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Mythic",
];

// A monotonic ladder score for a match's player rank, or null if unranked/unknown.
// Each class spans 4 tiers x ~6 steps = 24 units; higher is better.
function rankScore(player: any): number | null {
  const cls =
    typeof player?.classValue === "number"
      ? player.classValue
      : RANK_ORDER[player?.rank];
  if (cls === undefined || cls === null || cls < 0) return null;
  if (cls >= 6) return 6 * 24; // Mythic — top of the ladder
  const tier = typeof player?.tier === "number" ? player.tier : 4; // 4..1
  const step = typeof player?.step === "number" ? player.step : 0; // 0..~5
  return cls * 24 + (4 - tier) * 6 + step;
}

interface Pt {
  x: number;
  y: number;
}

// Minimal responsive SVG line + area chart.
function LineChart({
  points,
  color,
  min,
  max,
  height = 200,
  yTicks = [],
}: {
  points: Pt[];
  color: string;
  min: number;
  max: number;
  height?: number;
  yTicks?: { v: number; label: string }[];
}): JSX.Element {
  const W = 1000;
  const H = height;
  const pad = 8;
  const span = max - min || 1;
  const n = points.length;
  const sx = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * (W - pad * 2) + pad);
  const sy = (v: number) => H - pad - ((v - min) / span) * (H - pad * 2);

  const line = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${sx(i).toFixed(1)} ${sy(p.y).toFixed(1)}`
    )
    .join(" ");
  const area = `${line} L ${sx(n - 1).toFixed(1)} ${H - pad} L ${sx(0).toFixed(
    1
  )} ${H - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: `${H}px` }}
    >
      {yTicks.map((t) => (
        <g key={t.label}>
          <line
            x1={0}
            x2={W}
            y1={sy(t.v)}
            y2={sy(t.v)}
            stroke="var(--color-line-sep)"
            strokeWidth={1}
            opacity={0.4}
          />
          <text
            x={4}
            y={sy(t.v) - 3}
            fill="var(--color-text-dark)"
            fontSize={11}
          >
            {t.label}
          </text>
        </g>
      ))}
      {n > 1 && <path d={area} fill={color} opacity={0.12} />}
      {n > 1 && <path d={line} fill="none" stroke={color} strokeWidth={2.5} />}
      {n === 1 && <circle cx={sx(0)} cy={sy(points[0].y)} r={4} fill={color} />}
    </svg>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={{ textAlign: "center", minWidth: "110px" }}>
      <div style={{ fontSize: "28px", color: color || "var(--color-text)" }}>
        {value}
      </div>
      <div style={{ fontSize: "12px", color: "var(--color-text-dark)" }}>
        {label}
      </div>
    </div>
  );
}

export default function ViewTimeline(props: ViewTimelineProps): JSX.Element {
  const { matchesData } = props;

  const data = useMemo(() => {
    const matches = [...(matchesData || [])].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    const total = matches.length;
    const wins = matches.filter((m) => m.win).length;
    const losses = total - wins;

    // Cumulative win-rate over time.
    let running = 0;
    const winrateSeries: Pt[] = matches.map((m, i) => {
      if (m.win) running += 1;
      return { x: i, y: (running / (i + 1)) * 100 };
    });

    // Rank ladder over the matches that actually carry a rank.
    const rankSeries: Pt[] = [];
    matches.forEach((m, i) => {
      const s = rankScore(m.internalMatch?.player);
      if (s !== null) rankSeries.push({ x: i, y: s });
    });

    // Current streak (from most recent).
    let streak = 0;
    let streakWin = false;
    for (let i = matches.length - 1; i >= 0; i -= 1) {
      if (i === matches.length - 1) {
        streakWin = matches[i].win;
        streak = 1;
      } else if (matches[i].win === streakWin) {
        streak += 1;
      } else break;
    }

    const activity = matches.slice(-60);

    return {
      matches,
      total,
      wins,
      losses,
      winrate: total ? (wins / total) * 100 : 0,
      winrateSeries,
      rankSeries,
      streak,
      streakWin,
      activity,
      first: matches[0]?.timestamp,
      last: matches[matches.length - 1]?.timestamp,
    };
  }, [matchesData]);

  if (data.total === 0) {
    return (
      <Section style={{ margin: "24px 16px", justifyContent: "center" }}>
        <div style={{ padding: "48px", color: "var(--color-text-dark)" }}>
          No matches yet — play some games and your timeline will appear here.
        </div>
      </Section>
    );
  }

  const rankMax = 6 * 24;

  return (
    <div style={{ padding: "0 16px" }}>
      <Section
        style={{
          margin: "16px 0",
          padding: "20px",
          justifyContent: "space-around",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <Stat label="Matches" value={`${data.total}`} />
        <Stat
          label="Win rate"
          value={`${data.winrate.toFixed(1)}%`}
          color={data.winrate >= 50 ? "var(--color-g)" : "var(--color-r)"}
        />
        <Stat label="Record" value={`${data.wins}-${data.losses}`} />
        <Stat
          label={data.streakWin ? "Win streak" : "Loss streak"}
          value={`${data.streak}`}
          color={data.streakWin ? "var(--color-g)" : "var(--color-r)"}
        />
      </Section>

      <Section
        style={{ margin: "16px 0", padding: "16px", flexDirection: "column" }}
      >
        <div className="separator-title">Win rate over time</div>
        <LineChart
          points={data.winrateSeries}
          color="var(--color-g)"
          min={0}
          max={100}
          yTicks={[
            { v: 50, label: "50%" },
            { v: 100, label: "100%" },
          ]}
        />
      </Section>

      <Section
        style={{ margin: "16px 0", padding: "16px", flexDirection: "column" }}
      >
        <div className="separator-title">Rank progression</div>
        {data.rankSeries.length > 0 ? (
          <LineChart
            points={data.rankSeries}
            color="var(--color-text-link)"
            min={0}
            max={rankMax}
            yTicks={RANK_NAMES.map((name, idx) => ({
              v: idx * 24,
              label: name,
            }))}
          />
        ) : (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              color: "var(--color-text-dark)",
            }}
          >
            Play ranked matches to see your rank climb here. (Rank is captured
            per match going forward.)
          </div>
        )}
      </Section>

      <Section
        style={{
          margin: "16px 0 24px",
          padding: "16px",
          flexDirection: "column",
        }}
      >
        <div className="separator-title">Recent matches</div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            marginTop: "8px",
          }}
        >
          {data.activity.map((m) => (
            <div
              key={m.matchId}
              title={`${m.win ? "Win" : "Loss"} · ${new Date(
                m.timestamp
              ).toLocaleDateString()}`}
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "3px",
                backgroundColor: m.win ? "var(--color-g)" : "var(--color-r)",
                opacity: 0.85,
              }}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}
