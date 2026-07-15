import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import { AppState } from "../../../redux/stores/rendererStore";
import { getCardArtCrop } from "../../../utils/getCardArtCrop";
import Section from "../../ui/Section";
import { MatchData } from "../history/convertDbMatchData";

// Rank class -> badge colour, matching the Timeline palette.
const RANK_COLOR: Record<string, string> = {
  Beginner: "#8a8f98",
  Bronze: "#cd7f32",
  Silver: "#bfc4c9",
  Gold: "#f2c14e",
  Platinum: "#7fd8d8",
  Diamond: "#8ecae6",
  Mythic: "#ff5a1f",
  Unranked: "#6b7078",
};

interface ViewHomeProps {
  matchesData?: MatchData[];
}

function winStats(matches: MatchData[]) {
  const total = matches.length;
  const wins = matches.filter((m) => m.win).length;
  return {
    total,
    wins,
    losses: total - wins,
    winrate: total ? (wins / total) * 100 : 0,
  };
}

function RankChip({
  label,
  rankClass,
  level,
  step,
  percentile,
}: {
  label: string;
  rankClass?: string;
  level?: number;
  step?: number;
  percentile?: number;
}): JSX.Element {
  const cls = rankClass || "Unranked";
  const color = RANK_COLOR[cls] || RANK_COLOR.Unranked;
  let detail = "";
  if (cls === "Mythic") {
    detail = percentile ? `Top ${percentile.toFixed(1)}%` : "";
  } else if (cls !== "Unranked") {
    detail = `Tier ${level ?? "-"}${
      step ? ` · ${step} pip${step > 1 ? "s" : ""}` : ""
    }`;
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 16px",
        borderRadius: "6px",
        background: "var(--color-section-hover)",
        borderLeft: `4px solid ${color}`,
        minWidth: "180px",
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          color: "#1a1a1a",
        }}
      >
        {cls[0]}
      </div>
      <div>
        <div style={{ fontSize: "12px", color: "var(--color-text-dark)" }}>
          {label}
        </div>
        <div style={{ color: "var(--color-text)", fontSize: "16px" }}>
          {cls}
        </div>
        {detail && (
          <div style={{ fontSize: "12px", color: "var(--color-text-dark)" }}>
            {detail}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color?: string;
}): JSX.Element {
  return (
    <div style={{ textAlign: "center", minWidth: "96px" }}>
      <div style={{ fontSize: "26px", color: color || "var(--color-text)" }}>
        {value}
      </div>
      <div style={{ fontSize: "12px", color: "var(--color-text-dark)" }}>
        {label}
      </div>
    </div>
  );
}

function Wildcard({
  n,
  color,
  label,
}: {
  n: number;
  color: string;
  label: string;
}): JSX.Element {
  return (
    <div style={{ textAlign: "center", minWidth: "70px" }}>
      <div
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "50%",
          margin: "0 auto 4px",
          background: color,
          boxShadow: "0 0 6px rgba(0,0,0,0.4)",
        }}
      />
      <div style={{ fontSize: "18px", color: "var(--color-text)" }}>{n}</div>
      <div style={{ fontSize: "11px", color: "var(--color-text-dark)" }}>
        {label}
      </div>
    </div>
  );
}

export default function ViewHome(props: ViewHomeProps): JSX.Element {
  const { matchesData } = props;
  const history = useHistory();

  const currentUUID = useSelector(
    (state: AppState) => state.mainData.currentUUID
  );
  const uuidData = useSelector((state: AppState) => state.mainData.uuidData);
  const me = uuidData[currentUUID];
  const rank = me?.rank;
  const inv = me?.inventory;
  const displayName = me?.displayName || "Planeswalker";

  const data = useMemo(() => {
    const matches = [...(matchesData || [])].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    const all = winStats(matches);
    const recent = winStats(matches.slice(-30));

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

    // Top decks by games played.
    const deckMap = new Map<
      string,
      { id: string; name: string; tile: number; games: number; wins: number }
    >();
    matches.forEach((m) => {
      const name = m.internalMatch?.playerDeck?.name || "Unknown deck";
      const id = m.internalMatch?.playerDeck?.id || name;
      let d = deckMap.get(id);
      if (!d) {
        d = {
          id,
          name,
          tile: m.internalMatch?.playerDeck?.deckTileId || 0,
          games: 0,
          wins: 0,
        };
        deckMap.set(id, d);
      }
      d.games += 1;
      if (m.win) d.wins += 1;
    });
    const topDecks = [...deckMap.values()]
      .sort((a, b) => b.games - a.games)
      .slice(0, 5);

    return { all, recent, streak, streakWin, topDecks };
  }, [matchesData]);

  return (
    <div style={{ padding: "0 16px" }}>
      <Section
        style={{
          margin: "16px 0",
          padding: "20px",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ fontSize: "22px", color: "var(--color-text)" }}>
          Welcome back, {displayName}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
          <RankChip
            label="Constructed"
            rankClass={rank?.constructedClass}
            level={rank?.constructedLevel}
            step={rank?.constructedStep}
            percentile={rank?.constructedPercentile}
          />
          <RankChip
            label="Limited"
            rankClass={rank?.limitedClass}
            level={rank?.limitedLevel}
            step={rank?.limitedStep}
            percentile={rank?.limitedPercentile}
          />
        </div>
      </Section>

      <Section
        style={{
          margin: "16px 0",
          padding: "20px",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div className="separator-title">Performance</div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <Metric value={`${data.all.total}`} label="Matches" />
          <Metric
            value={`${data.all.winrate.toFixed(1)}%`}
            label="Win rate"
            color={data.all.winrate >= 50 ? "var(--color-g)" : "var(--color-r)"}
          />
          <Metric
            value={`${data.all.wins}-${data.all.losses}`}
            label="Record"
          />
          <Metric
            value={`${data.recent.winrate.toFixed(0)}%`}
            label="Last 30"
            color={
              data.recent.winrate >= 50 ? "var(--color-g)" : "var(--color-r)"
            }
          />
          <Metric
            value={`${data.streak}`}
            label={data.streakWin ? "Win streak" : "Loss streak"}
            color={data.streakWin ? "var(--color-g)" : "var(--color-r)"}
          />
        </div>
      </Section>

      {data.topDecks.length > 0 && (
        <Section
          style={{ margin: "16px 0", padding: "16px", flexDirection: "column" }}
        >
          <div className="separator-title">Top decks</div>
          <div style={{ marginTop: "10px" }}>
            {data.topDecks.map((d) => {
              const wr = d.games ? (d.wins / d.games) * 100 : 0;
              return (
                <div
                  key={d.id}
                  onClick={() =>
                    history.push(`/decks/${encodeURIComponent(d.id)}`)
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  className="list-item-container"
                >
                  <div
                    style={{
                      width: "96px",
                      height: "36px",
                      borderRadius: "3px",
                      flexShrink: 0,
                      backgroundImage: `url(${getCardArtCrop(d.tile)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div style={{ flex: 1, color: "var(--color-text)" }}>
                    {d.name}
                  </div>
                  <div
                    style={{
                      color: "var(--color-text-dark)",
                      fontSize: "13px",
                    }}
                  >
                    {d.games} games
                  </div>
                  <div
                    style={{
                      width: "56px",
                      textAlign: "right",
                      color: wr >= 50 ? "var(--color-g)" : "var(--color-r)",
                    }}
                  >
                    {wr.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {inv && (
        <Section
          style={{
            margin: "16px 0 24px",
            padding: "20px",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div className="separator-title">Economy</div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <Wildcard
              n={inv.WildCardCommons || 0}
              color="#c8c8c8"
              label="Common"
            />
            <Wildcard
              n={inv.WildCardUnCommons || 0}
              color="#a7c7d8"
              label="Uncommon"
            />
            <Wildcard n={inv.WildCardRares || 0} color="#e2b13c" label="Rare" />
            <Wildcard
              n={inv.WildCardMythics || 0}
              color="#f5622e"
              label="Mythic"
            />
            <Metric value={`${inv.Gems || 0}`} label="Gems" />
            <Metric value={`${inv.Gold || 0}`} label="Gold" />
            <Metric
              value={`${Math.round(inv.TotalVaultProgress || 0)}%`}
              label="Vault"
            />
          </div>
        </Section>
      )}
    </div>
  );
}
