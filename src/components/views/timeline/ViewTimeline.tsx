import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { useCardArtCrop } from "../../../hooks/useCardImage";
import { AppState } from "../../../redux/stores/rendererStore";
import isLimitedEventId from "../../../utils/isLimitedEventId";
import FormatToggle, { MatchFormat } from "../../ui/FormatToggle";
import Section from "../../ui/Section";
import { MatchData } from "../history/convertDbMatchData";

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

// Per-class label + badge colour, used for the y-axis and the rank-up badges.
const RANK_META: Record<number, { name: string; color: string }> = {
  0: { name: "Beginner", color: "#8a8f98" },
  1: { name: "Bronze", color: "#cd7f32" },
  2: { name: "Silver", color: "#bfc4c9" },
  3: { name: "Gold", color: "#f2c14e" },
  4: { name: "Platinum", color: "#7fd8d8" },
  5: { name: "Diamond", color: "#8ecae6" },
  6: { name: "Mythic", color: "#ff5a1f" },
};

// A distinct, bright colour per deck, derived deterministically from the deck
// name — so it's stable across renders and never runs out the way a fixed
// palette would. Fixed saturation/lightness keeps every deck readable.
function deckColorFor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}deg, 72%, 64%)`;
}

// The player's rank class for a match, or null if unranked/unknown.
function matchClass(player: any): number | null {
  const cls =
    typeof player?.classValue === "number"
      ? player.classValue
      : RANK_ORDER[player?.rank];
  if (cls === undefined || cls === null || cls < 0) return null;
  return cls;
}

// A monotonic ladder score for a match's player rank (each class spans
// 4 tiers x ~6 steps = 24 units; higher is better).
function rankScore(player: any): number | null {
  const cls = matchClass(player);
  if (cls === null) return null;
  if (cls >= 6) return 6 * 24; // Mythic — top of the ladder
  const tier = typeof player?.tier === "number" ? player.tier : 4; // 4..1
  const step = typeof player?.step === "number" ? player.step : 0; // 0..~5
  return cls * 24 + (4 - tier) * 6 + step;
}

interface Pt {
  x: number;
  y: number;
}

interface Marker {
  i: number;
  v: number;
  node: JSX.Element;
  title?: string;
}

// A colored background span covering point indices [i0, i1] (inclusive) — used
// to highlight which deck was played across each stretch of the timeline.
interface Band {
  i0: number;
  i1: number;
  color: string;
  name?: string;
  title?: string;
}

/** Vertical rule between two matches — a season reset, for now. */
interface Divider {
  i: number;
  label: string;
  title?: string;
}

// Inner vertical padding (percent) so the top/bottom gridline labels never clip.
const PAD = 8;

// Responsive line + area chart. Gridlines/labels are HTML (positioned by
// percent) so they never clip or stretch; only the line/area live in the SVG,
// which uses a non-scaling stroke to stay crisp under non-uniform scaling.
function LineChart({
  points,
  color,
  min,
  max,
  height = 200,
  yTicks = [],
  markers = [],
  bands = [],
  dividers = [],
  activeDeck,
  onBandHover,
}: {
  points: Pt[];
  color: string;
  min: number;
  max: number;
  height?: number;
  yTicks?: { v: number; label: string }[];
  markers?: Marker[];
  bands?: Band[];
  dividers?: Divider[];
  activeDeck?: string | null;
  onBandHover?: (name: string | null) => void;
}): JSX.Element {
  const n = points.length;
  const span = max - min || 1;
  const xPct = (i: number): number => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const yPct = (v: number): number =>
    PAD + (1 - (v - min) / span) * (100 - PAD * 2);

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xPct(i)} ${yPct(p.y)}`)
    .join(" ");
  const area = n > 1 ? `${path} L 100 100 L 0 100 Z` : "";

  const LABEL_W = 60;

  return (
    <div
      style={{ position: "relative", height: `${height}px`, marginTop: "12px" }}
    >
      {yTicks.map((t) => (
        <div
          key={t.label}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${yPct(t.v)}%`,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 0,
              width: `${LABEL_W - 10}px`,
              transform: "translateY(-50%)",
              textAlign: "right",
              fontSize: "11px",
              color: "var(--color-text-dark)",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </span>
          <div
            style={{
              position: "absolute",
              left: `${LABEL_W}px`,
              right: 0,
              borderTop: "1px solid var(--color-line-sep)",
              opacity: 0.35,
            }}
          />
        </div>
      ))}

      <div
        style={{
          position: "absolute",
          left: `${LABEL_W}px`,
          right: 0,
          top: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        {bands.map((b) => {
          const active = activeDeck && b.name === activeDeck;
          return (
            <div
              key={`band-${b.i0}`}
              title={b.title}
              onMouseEnter={() => onBandHover?.(b.name ?? null)}
              onMouseLeave={() => onBandHover?.(null)}
              style={{
                position: "absolute",
                left: `${(b.i0 / n) * 100}%`,
                width: `${((b.i1 - b.i0 + 1) / n) * 100}%`,
                top: 0,
                bottom: 0,
                background: b.color,
                opacity: active ? 0.42 : 0.16,
                transition: "opacity 0.12s ease-in-out",
                cursor: "pointer",
              }}
            />
          );
        })}

        {/* Drawn over the bands but under the line, so a reset reads as a
            boundary between stretches rather than a data point. */}
        {dividers.map((d) => (
          <div
            key={`divider-${d.i}`}
            title={d.title}
            style={{
              position: "absolute",
              left: `${(d.i / n) * 100}%`,
              top: 0,
              bottom: 0,
              borderLeft: "2px dashed var(--color-text-dark)",
              opacity: 0.85,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "2px",
                left: "4px",
                fontSize: "10px",
                whiteSpace: "nowrap",
                color: "var(--color-text-dark)",
                fontFamily: "var(--main-font-name-it)",
              }}
            >
              {d.label}
            </span>
          </div>
        ))}

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          {n > 1 && <path d={area} fill={color} opacity={0.12} />}
          {n > 1 && (
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {n === 1 && (
            <circle
              cx={xPct(0)}
              cy={yPct(points[0].y)}
              r={3}
              fill={color}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {markers.map((m) => (
          <div
            key={`${m.i}-${m.v}`}
            title={m.title}
            style={{
              position: "absolute",
              left: `${xPct(m.i)}%`,
              top: `${yPct(m.v)}%`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "auto",
            }}
          >
            {m.node}
          </div>
        ))}
      </div>
    </div>
  );
}

function RankBadge({ cls, tier }: { cls: number; tier?: number }): JSX.Element {
  const meta = RANK_META[cls] || RANK_META[0];
  // "B1", "G4", ... — Mythic has no tiers, just "M".
  const label = `${meta.name[0]}${cls >= 6 || !tier ? "" : tier}`;
  return (
    <div
      style={{
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        background: meta.color,
        border: "2px solid var(--color-section)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "10px",
        fontWeight: 700,
        color: "#1a1a1a",
      }}
    >
      {label}
    </div>
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

interface DeckStat {
  name: string;
  games: number;
  wins: number;
  color: string;
  tileId: number;
  firstTs: number;
  lastTs: number;
  minCls: number | null;
  maxCls: number | null;
}

// Right-column detail panel for the hovered (or top) deck.
function DeckPanel({ deck }: { deck?: DeckStat }): JSX.Element {
  const deckTileArt = useCardArtCrop(deck?.tileId);
  if (!deck) {
    return (
      <div style={{ padding: "16px", color: "var(--color-text-dark)" }}>
        Hover a deck band or legend entry to see its stats.
      </div>
    );
  }

  const losses = deck.games - deck.wins;
  const wr = deck.games ? (deck.wins / deck.games) * 100 : 0;
  const dateRange =
    deck.firstTs && deck.lastTs
      ? `${new Date(deck.firstTs).toLocaleDateString()} – ${new Date(
          deck.lastTs
        ).toLocaleDateString()}`
      : "—";
  let rankRange: string | null = null;
  if (deck.minCls !== null && deck.maxCls !== null) {
    const lo = RANK_META[deck.minCls]?.name;
    const hi = RANK_META[deck.maxCls]?.name;
    rankRange = deck.minCls === deck.maxCls ? lo : `${lo} → ${hi}`;
  }

  const row = (label: string, value: string) => (
    <div
      style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}
    >
      <span style={{ color: "var(--color-text-dark)", fontSize: "13px" }}>
        {label}
      </span>
      <span style={{ color: "var(--color-text)", fontSize: "13px" }}>
        {value}
      </span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div
        style={{
          height: "72px",
          borderRadius: "4px",
          backgroundImage: `url(${deckTileArt})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderBottom: `3px solid ${deck.color}`,
        }}
      />
      <div style={{ color: "var(--color-text)", fontSize: "17px" }}>
        {deck.name}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <span
          style={{
            fontSize: "30px",
            color: wr >= 50 ? "var(--color-g)" : "var(--color-r)",
          }}
        >
          {wr.toFixed(0)}%
        </span>
        <span style={{ color: "var(--color-text-dark)" }}>
          {deck.wins}-{losses}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {row("Games", `${deck.games}`)}
        {row("Played", dateRange)}
        {rankRange && row("Ranks", rankRange)}
      </div>
    </div>
  );
}

interface ViewTimelineProps {
  matchesData: MatchData[];
}

export default function ViewTimeline(props: ViewTimelineProps): JSX.Element {
  const { matchesData } = props;
  const [hoveredDeck, setHoveredDeck] = useState<string | null>(null);
  const [format, setFormat] = useState<MatchFormat>("constructed");
  const seasons = useSelector((state: AppState) => state.mainData.seasons);

  const switchFormat = (next: MatchFormat): void => {
    setFormat(next);
    // The hovered deck belongs to the format we're leaving.
    setHoveredDeck(null);
  };

  const data = useMemo(() => {
    const matches = (matchesData || [])
      .filter((m) => (format === "limited") === isLimitedEventId(m.eventId))
      .sort((a, b) => a.timestamp - b.timestamp);

    const total = matches.length;
    const wins = matches.filter((m) => m.win).length;
    const losses = total - wins;

    // Cumulative win-rate over time.
    let running = 0;
    const winrateSeries: Pt[] = matches.map((m, i) => {
      if (m.win) running += 1;
      return { x: i, y: (running / (i + 1)) * 100 };
    });

    // The played deck's name (playerDeckName is actually the player's name).
    const deckNameOf = (m: MatchData): string =>
      m.internalMatch?.playerDeck?.name || "Unknown deck";

    // Per-deck stats for the legend + right-side panel.
    const deckMap = new Map<string, DeckStat>();
    matches.forEach((m) => {
      const name = deckNameOf(m);
      let d = deckMap.get(name);
      if (!d) {
        d = {
          name,
          games: 0,
          wins: 0,
          color: deckColorFor(name),
          tileId: m.internalMatch?.playerDeck?.deckTileId || 0,
          firstTs: m.timestamp,
          lastTs: m.timestamp,
          minCls: null,
          maxCls: null,
        };
        deckMap.set(name, d);
      }
      d.games += 1;
      if (m.win) d.wins += 1;
      d.firstTs = Math.min(d.firstTs, m.timestamp);
      d.lastTs = Math.max(d.lastTs, m.timestamp);
      const cls = matchClass(m.internalMatch?.player);
      if (cls !== null) {
        d.minCls = d.minCls === null ? cls : Math.min(d.minCls, cls);
        d.maxCls = d.maxCls === null ? cls : Math.max(d.maxCls, cls);
      }
    });
    const decks = [...deckMap.values()].sort((a, b) => b.games - a.games);

    // Contiguous runs of the same deck -> highlight bands, in the coordinate
    // space of whichever series they annotate.
    const bandsFor = (names: string[]): Band[] => {
      const out: Band[] = [];
      let prev: string | null = null;
      names.forEach((name, i) => {
        if (name === prev) {
          out[out.length - 1].i1 = i;
        } else {
          out.push({
            i0: i,
            i1: i,
            name,
            color: deckMap.get(name)?.color || "var(--color-text-dark)",
            title: name,
          });
          prev = name;
        }
      });
      return out;
    };

    const deckBands = bandsFor(matches.map(deckNameOf));

    const seasonList = Object.values(seasons)
      .filter((s) => s.start > 0)
      .sort((a, b) => a.start - b.start);

    // Rank ladder over the matches that carry a rank, plus a badge each time
    // the rank class advances, plus deck bands and season dividers in
    // rank-series index space. The tab is already scoped to one format, so
    // this never mixes the Constructed and Limited ladders.
    const buildRankChart = (ms: MatchData[]) => {
      const series: Pt[] = [];
      const deckNames: string[] = [];
      const timestamps: number[] = [];
      const ups: Marker[] = [];
      let prevCls: number | null = null;
      let prevTierIdx: number | null = null;
      ms.forEach((m) => {
        const player = m.internalMatch?.player;
        const s = rankScore(player);
        const cls = matchClass(player);
        if (s === null || cls === null) return;
        // Tier is 4..1 (1 = highest); index it so bigger = better. Mythic has
        // no tiers — treat it as above every tier.
        const tier =
          typeof (player as any)?.tier === "number"
            ? ((player as any).tier as number)
            : null;
        const tierIdx = cls >= 6 ? 99 : 4 - (tier ?? 4);

        const idx = series.length;
        series.push({ x: idx, y: s });
        deckNames.push(deckNameOf(m));
        timestamps.push(m.timestamp);

        // Badge every advance: a new class (Bronze -> Silver) or a new tier
        // within the class (Bronze 2 -> Bronze 1). Rank is captured at match
        // start, so the badge lands on the first match played AT the new rank.
        const classUp = prevCls !== null && cls > prevCls;
        const tierUp =
          prevCls !== null &&
          cls === prevCls &&
          prevTierIdx !== null &&
          tierIdx > prevTierIdx;
        if (classUp || tierUp) {
          const name = RANK_META[cls]?.name || "?";
          const tierLabel = cls >= 6 || tier === null ? "" : ` ${tier}`;
          ups.push({
            i: idx,
            v: s,
            node: <RankBadge cls={cls} tier={tier ?? undefined} />,
            title: `Ranked up to ${name}${tierLabel} · ${new Date(
              m.timestamp
            ).toLocaleDateString()}`,
          });
        }
        prevCls = cls;
        prevTierIdx = tierIdx;
      });

      const dividers: Divider[] = seasonList
        .map((season) => ({
          season,
          idx: timestamps.findIndex((t) => t >= season.start),
        }))
        .filter(({ idx }) => idx > 0)
        .map(({ season, idx }) => ({
          i: idx,
          label: `Season ${season.ordinal}`,
          title: `Season ${season.ordinal} started ${new Date(
            season.start
          ).toLocaleString()}`,
        }));

      return { series, ups, bands: bandsFor(deckNames), dividers };
    };

    const rank = buildRankChart(matches);

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

    // Season resets. The x axis is match index, not time, so a season start
    // lands on the first match played after it — matches carry no seasonOrdinal
    // to key off, and a rank drop can't be used either (losing a tier looks the
    // same). Seasons only appear here once the client has reported them, so
    // older boundaries are simply absent rather than guessed at.
    const seasonDividers: Divider[] = seasonList
      .map((s) => {
        const idx = matches.findIndex((m) => m.timestamp >= s.start);
        return { season: s, idx };
      })
      // Not started yet, or began before any match we hold — nothing to divide.
      .filter(({ idx }) => idx > 0)
      .map(({ season, idx }) => ({
        i: idx,
        label: `Season ${season.ordinal}`,
        title: `Season ${season.ordinal} started ${new Date(
          season.start
        ).toLocaleString()}`,
      }));

    return {
      total,
      wins,
      losses,
      winrate: total ? (wins / total) * 100 : 0,
      winrateSeries,
      rank,
      deckBands,
      seasonDividers,
      decks,
      deckMap,
      streak,
      streakWin,
    };
  }, [matchesData, seasons, format]);

  if ((matchesData || []).length === 0) {
    return (
      <Section style={{ margin: "24px 16px", justifyContent: "center" }}>
        <div style={{ padding: "48px", color: "var(--color-text-dark)" }}>
          No matches yet — play some games and your timeline will appear here.
        </div>
      </Section>
    );
  }

  const rankMax = 6 * 24;
  const panelDeck =
    (hoveredDeck && data.deckMap.get(hoveredDeck)) || data.decks[0];

  return (
    <div style={{ padding: "0 16px" }}>
      {/* Full-width summary header, scoped (like everything below it) to the
          selected format. */}
      <Section
        style={{
          margin: "16px 0",
          padding: "20px",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <FormatToggle format={format} onChange={switchFormat} />
        {data.total > 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              flexWrap: "wrap",
              gap: "16px",
              width: "100%",
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
          </div>
        ) : (
          <div
            style={{
              padding: "16px",
              textAlign: "center",
              color: "var(--color-text-dark)",
            }}
          >
            {`No ${
              format === "limited" ? "Limited" : "Constructed"
            } matches yet.`}
          </div>
        )}
      </Section>

      {/* Graphs (left) + deck detail (right) */}
      {data.total > 0 && (
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Section
              style={{
                margin: "0 0 16px",
                padding: "16px",
                flexDirection: "column",
              }}
            >
              <div className="separator-title">Win rate over time</div>
              <div
                style={{ fontSize: "12px", color: "var(--color-text-dark)" }}
              >
                Background bands show the deck played across each stretch —
                hover for its stats.
              </div>
              <LineChart
                points={data.winrateSeries}
                color="var(--color-g)"
                min={0}
                max={100}
                bands={data.deckBands}
                dividers={data.seasonDividers}
                activeDeck={hoveredDeck}
                onBandHover={setHoveredDeck}
                yTicks={[
                  { v: 0, label: "0%" },
                  { v: 50, label: "50%" },
                  { v: 100, label: "100%" },
                ]}
              />
            </Section>

            <Section
              style={{
                margin: "0 0 16px",
                padding: "16px",
                flexDirection: "column",
              }}
            >
              <div className="separator-title">Rank progression</div>
              {data.rank.series.length > 0 ? (
                <LineChart
                  points={data.rank.series}
                  color="var(--color-text-link)"
                  min={0}
                  max={rankMax}
                  bands={data.rank.bands}
                  dividers={data.rank.dividers}
                  activeDeck={hoveredDeck}
                  onBandHover={setHoveredDeck}
                  yTicks={[1, 2, 3, 4, 5, 6].map((cls) => ({
                    v: cls * 24,
                    label: RANK_META[cls].name,
                  }))}
                  markers={data.rank.ups}
                />
              ) : (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "var(--color-text-dark)",
                  }}
                >
                  Play ranked matches to see your rank climb here, with a badge
                  each time you advance a rank. (Rank is captured per match
                  going forward.)
                </div>
              )}
            </Section>

            {data.decks.length > 0 && (
              <Section
                style={{
                  margin: "0 0 24px",
                  padding: "16px",
                  flexDirection: "column",
                }}
              >
                <div className="separator-title">Decks played</div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px 20px",
                    marginTop: "10px",
                  }}
                >
                  {data.decks.map((d) => {
                    const wr = d.games ? (d.wins / d.games) * 100 : 0;
                    return (
                      <div
                        key={d.name}
                        onMouseEnter={() => setHoveredDeck(d.name)}
                        onMouseLeave={() => setHoveredDeck(null)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          opacity:
                            hoveredDeck && hoveredDeck !== d.name ? 0.5 : 1,
                        }}
                      >
                        <span
                          style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "3px",
                            background: d.color,
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ color: "var(--color-text)" }}>
                          {d.name}
                        </span>
                        <span
                          style={{
                            color: "var(--color-text-dark)",
                            fontSize: "13px",
                          }}
                        >
                          {d.wins}-{d.games - d.wins} ({wr.toFixed(0)}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}
          </div>

          <div style={{ width: "260px", flexShrink: 0 }}>
            <Section
              style={{
                margin: 0,
                padding: "16px",
                flexDirection: "column",
                position: "sticky",
                top: "16px",
              }}
            >
              <div className="separator-title">
                {hoveredDeck ? "Deck" : "Top deck"}
              </div>
              <div style={{ marginTop: "10px" }}>
                <DeckPanel deck={panelDeck} />
              </div>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}
