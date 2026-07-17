import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import { DEFAULT_TILE } from "../../../constants";
import { AppState } from "../../../redux/stores/rendererStore";
import { StatsDeck } from "../../../types/dbTypes";
import getRankIndex from "../../../utils/getRankIndex";
import Deck from "../../../utils/mtga/deck";
import vodiFn from "../../../utils/voidfn";
import DecksArtViewRow from "../../DecksArtViewRow";
import Section from "../../ui/Section";
import { MatchData } from "../history/convertDbMatchData";

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

// The real rank badge sprite (ranks_constructed_48.png via the `.rank` class),
// offset to the player's rank + tier — same as the top-nav rank icon.
function RankChip({
  label,
  rankClass,
  tier,
  step,
  percentile,
}: {
  label: string;
  rankClass?: string;
  tier?: number;
  step?: number;
  percentile?: number;
}): JSX.Element {
  const cls = rankClass || "Unranked";
  let detail = "";
  if (cls === "Mythic") {
    detail = percentile ? `Top ${percentile.toFixed(1)}%` : "Mythic";
  } else if (cls !== "Unranked") {
    detail = `Tier ${tier ?? "-"}${
      step ? ` · ${step} pip${step > 1 ? "s" : ""}` : ""
    }`;
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 20px 8px 8px",
        borderRadius: "6px",
        background: "var(--color-section-hover)",
        minWidth: "190px",
      }}
    >
      <div
        className="rank"
        style={{
          margin: 0,
          flexShrink: 0,
          backgroundPosition: `${getRankIndex(cls, tier || 1) * -48}px 0px`,
        }}
      />
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

// Reuse the app's wildcard icons (wc-explore-cost + wc-<rarity>), which render
// the wildcard art with the count beneath.
function WildcardIcon({
  rarity,
  n,
}: {
  rarity: "common" | "uncommon" | "rare" | "mythic";
  n: number;
}): JSX.Element {
  return (
    <div className={`wc-explore-cost wc-${rarity}`} title={rarity}>
      {n}
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
  const displayName = (me?.displayName || "Planeswalker").split("#")[0];

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

    // Top decks by games played, as StatsDecks so DecksArtViewRow can render
    // them exactly like the played-decks list.
    const agg = new Map<
      string,
      { games: number; wins: number; lastTs: number; pd: any }
    >();
    matches.forEach((m) => {
      const pd = m.internalMatch?.playerDeck;
      const id = pd?.id || pd?.name || "unknown";
      let d = agg.get(id);
      if (!d) {
        d = { games: 0, wins: 0, lastTs: 0, pd };
        agg.set(id, d);
      }
      d.games += 1;
      if (m.win) d.wins += 1;
      d.lastTs = Math.max(d.lastTs, m.timestamp);
    });
    const topDecks: StatsDeck[] = [...agg.values()]
      .sort((a, b) => b.games - a.games)
      .slice(0, 5)
      .map((d) => {
        const pd = d.pd || {};
        const deck = new Deck(pd);
        return {
          id: pd.id || pd.name || "unknown",
          name: pd.name || "Unknown deck",
          deckTileId: pd.deckTileId || DEFAULT_TILE,
          mainDeck: pd.mainDeck || [],
          sideboard: pd.sideboard || [],
          colors: deck.colors.getBits(),
          playerId: "",
          deckHash: "",
          matches: {},
          lastUsed: d.lastTs,
          stats: {
            gameWins: 0,
            gameLosses: 0,
            matchWins: d.wins,
            matchLosses: d.games - d.wins,
          },
          totalGames: d.games,
          cardWinrates: {},
          winrate: d.games ? (d.wins / d.games) * 100 : 0,
        };
      });

    return { all, recent, streak, streakWin, topDecks };
  }, [matchesData]);

  return (
    <div style={{ padding: "0 16px" }}>
      <Section style={{ margin: "16px 0", padding: "24px 20px" }}>
        <div style={{ fontSize: "24px", color: "var(--color-text)" }}>
          Welcome back, {displayName}
        </div>
      </Section>

      <Section
        style={{ margin: "16px 0", padding: "16px", flexDirection: "column" }}
      >
        <div className="separator-title">Rank</div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "10px",
          }}
        >
          <RankChip
            label="Constructed"
            rankClass={rank?.constructedClass}
            tier={rank?.constructedLevel}
            step={rank?.constructedStep}
            percentile={rank?.constructedPercentile}
          />
          <RankChip
            label="Limited"
            rankClass={rank?.limitedClass}
            tier={rank?.limitedLevel}
            step={rank?.limitedStep}
            percentile={rank?.limitedPercentile}
          />
        </div>
      </Section>

      <Section
        style={{ margin: "16px 0", padding: "20px", flexDirection: "column" }}
      >
        <div className="separator-title">Performance</div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
            gap: "16px",
            marginTop: "12px",
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
          <div className="decks-table-wrapper" style={{ marginTop: "10px" }}>
            {data.topDecks.map((deck) => (
              <DecksArtViewRow
                key={deck.id}
                deck={deck}
                clickDeck={(d) =>
                  history.push(`/decks/${encodeURIComponent(d.id)}`)
                }
                hidden={false}
                hide={vodiFn}
                unhide={vodiFn}
                showArchive={false}
              />
            ))}
          </div>
        </Section>
      )}

      {inv && (
        <Section
          style={{
            margin: "16px 0 24px",
            padding: "20px",
            flexDirection: "column",
          }}
        >
          <div className="separator-title">Economy</div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              marginTop: "8px",
            }}
          >
            <WildcardIcon rarity="common" n={inv.WildCardCommons || 0} />
            <WildcardIcon rarity="uncommon" n={inv.WildCardUnCommons || 0} />
            <WildcardIcon rarity="rare" n={inv.WildCardRares || 0} />
            <WildcardIcon rarity="mythic" n={inv.WildCardMythics || 0} />
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
