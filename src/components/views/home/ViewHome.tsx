import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";

import { DEFAULT_TILE } from "../../../constants";
import { useCards } from "../../../hooks/useCard";
import { AppState } from "../../../redux/stores/rendererStore";
import { StatsDeck } from "../../../types/dbTypes";
import Deck from "../../../utils/mtga/deck";
import vodiFn from "../../../utils/voidfn";
import DecksArtViewRow from "../../DecksArtViewRow";
import Section from "../../ui/Section";
import { MatchData } from "../history/convertDbMatchData";
import BestRanksFeed from "./BestRanksFeed";

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

/**
 * Lower bound of the 95% Wilson interval on a win rate.
 *
 * Ranking on the raw rate makes "top decks" mean "whatever you last went 2-0
 * with": a single good night outranks a deck with forty games behind it. This
 * scores a record by the rate it can be trusted to be at least, so a small
 * sample has to be extraordinary to beat a proven one.
 */
function winrateScore(wins: number, games: number): number {
  if (!games) return 0;
  const z = 1.96;
  const p = wins / games;
  const centre = p + (z * z) / (2 * games);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * games)) / games);
  return (centre - margin) / (1 + (z * z) / games);
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
  const inv = me?.inventory;
  const displayName = (me?.displayName || "Planeswalker").split("#")[0];

  // Everything that does not need a card lookup. Split from the deck list
  // below because that half has to wait on the database.
  const stats = useMemo(() => {
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

    let bestWinStreak = 0;
    let run = 0;
    matches.forEach((m) => {
      if (m.win) {
        run += 1;
        bestWinStreak = Math.max(bestWinStreak, run);
      } else {
        run = 0;
      }
    });

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

    // Best record first, not most played.
    const played = [...agg.values()]
      .sort(
        (a, b) => winrateScore(b.wins, b.games) - winrateScore(a.wins, a.games)
      )
      .slice(0, 5);

    return { all, recent, streak, streakWin, bestWinStreak, played };
  }, [matchesData]);

  // A deck's colors are read off its lands, which means a card lookup — and
  // those answer from a worker. Nothing had fetched them, so on a cold open
  // every deck resolved to no colors and the tiles rendered blank. Ask for the
  // cards the decks are built from, and rebuild once they land.
  const grpIds = useMemo(() => {
    const ids = new Set<number>();
    stats.played.forEach((d) => {
      (d.pd?.mainDeck || []).forEach((c: { id: number }) => {
        if (c?.id) ids.add(c.id);
      });
    });
    return [...ids];
  }, [stats.played]);

  const resolvedCards = useCards(grpIds);

  const topDecks: StatsDeck[] = useMemo(
    () =>
      stats.played.map((d) => {
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
      }),
    // resolvedCards is the point: the colors above are only right once the
    // lookups have come back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stats.played, resolvedCards]
  );

  return (
    <div style={{ padding: "0 16px" }}>
      <Section style={{ margin: "16px 0", padding: "24px 20px" }}>
        <div style={{ fontSize: "24px", color: "var(--color-text)" }}>
          Welcome back, {displayName}
        </div>
      </Section>

      <Section
        style={{ margin: "16px 0", padding: "20px", flexDirection: "column" }}
      >
        <div className="separator-title">Top ranked players</div>
        <BestRanksFeed />
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
          <Metric value={`${stats.all.total}`} label="Matches" />
          <Metric
            value={`${stats.all.winrate.toFixed(1)}%`}
            label="Win rate"
            color={
              stats.all.winrate >= 50 ? "var(--color-g)" : "var(--color-r)"
            }
          />
          <Metric
            value={`${stats.all.wins}-${stats.all.losses}`}
            label="Record"
          />
          <Metric
            value={`${stats.recent.winrate.toFixed(0)}%`}
            label="Last 30"
            color={
              stats.recent.winrate >= 50 ? "var(--color-g)" : "var(--color-r)"
            }
          />
          <Metric
            value={`${stats.streak}${stats.streakWin ? "W" : "L"}`}
            label="Current streak"
            color={stats.streakWin ? "var(--color-g)" : "var(--color-r)"}
          />
          <Metric value={`${stats.bestWinStreak}`} label="Best win streak" />
        </div>
      </Section>

      {topDecks.length > 0 && (
        <Section
          style={{ margin: "16px 0", padding: "16px", flexDirection: "column" }}
        >
          <div className="separator-title">Top decks</div>
          <div className="decks-table-wrapper" style={{ marginTop: "10px" }}>
            {topDecks.map((deck) => (
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
            {/* Arena reports this scaled by ten — 679 is 67.9% — so it read
                as a vault seven times over. Not clamped: it really can pass
                100% before the vault opens. */}
            <Metric
              value={`${((inv.TotalVaultProgress || 0) / 10).toFixed(1)}%`}
              label="Vault"
            />
          </div>
        </Section>
      )}
    </div>
  );
}
