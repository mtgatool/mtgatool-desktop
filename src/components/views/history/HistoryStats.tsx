/* eslint-disable radix */

import { PieChart } from "react-minimal-pie-chart";
import { useSelector } from "react-redux";

import { COLORLESS } from "../../../constants";
import { AppState } from "../../../redux/stores/rendererStore";
import { Winrate } from "../../../utils/aggregateStats";
import { toDDHHMMSS, toMMSS } from "../../../utils/dateTo";
import formatPercent from "../../../utils/formatPercent";
import getWinrateClass from "../../../utils/getWinrateClass";
import Colors from "../../../utils/mtga/colors";
import Flex from "../../Flex";
import ManaCost from "../../ManaCost";
import RankSmall from "../../RankSmall";

/** Only rank a colour pairing once it has a real sample behind it. */
const MIN_GAMES = 3;

const RANK_ROWS = [
  "Mythic",
  "Diamond",
  "Platinum",
  "Gold",
  "Silver",
  "Bronze",
  "Unranked",
];

function getWinrateValue(wr: Winrate) {
  return wr.losses + wr.wins > 0 ? wr.wins / (wr.losses + wr.wins) : 0;
}

function games(wr: Winrate): number {
  return wr.wins + wr.losses;
}

/** "12:8 (60%)", coloured by how good the rate is. */
function Record({ wr }: { wr: Winrate }): JSX.Element {
  const rate = getWinrateValue(wr);
  return (
    <div className="wr-color-number">
      {wr.wins}:{wr.losses} (
      <span className={getWinrateClass(rate, true)}>{formatPercent(rate)}</span>
      )
    </div>
  );
}

function ColorWinrateList({
  winrates,
  keyPrefix,
}: {
  winrates: Record<number, Winrate>;
  keyPrefix: string;
}): JSX.Element {
  return (
    <>
      {Object.keys(winrates)
        .filter((c) => games(winrates[c as any]) > MIN_GAMES)
        // Most-played pairings first — a 1:0 coin flip should never outrank
        // a 26:24 grind. Winrate breaks ties.
        .sort((a, b) => {
          const ga = games(winrates[a as any]);
          const gb = games(winrates[b as any]);
          if (ga !== gb) return gb - ga;
          return (
            getWinrateValue(winrates[b as any]) -
            getWinrateValue(winrates[a as any])
          );
        })
        .map((color) => {
          const wr = winrates[color as any];
          const arrCol = new Colors();
          arrCol.addFromBits(parseInt(color));
          return (
            <div className="color-wr-line" key={`${keyPrefix}-${color}`}>
              <ManaCost
                colors={arrCol.getBits() !== 0 ? arrCol.get() : [COLORLESS]}
              />
              <Record wr={wr} />
            </div>
          );
        })}
    </>
  );
}

function WinratePie({
  title,
  wr,
}: {
  title: string;
  wr: Winrate;
}): JSX.Element {
  const data = [
    { title: "Wins", value: wr.wins, color: "#AABEDF" },
    { title: "Losses", value: wr.losses, color: "#5F6A7B" },
  ];
  return (
    <Flex className="winrate-pie">
      <h3>{title}</h3>
      <h3 className="pie-center-text">{formatPercent(getWinrateValue(wr))}</h3>
      <PieChart
        viewBoxSize={[180, 180]}
        center={[90, 90]}
        radius={70}
        lineWidth={33}
        startAngle={270}
        data={data}
      />
    </Flex>
  );
}

function StatLine({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>): JSX.Element {
  return (
    <Flex style={{ margin: "6px 0" }}>
      <h3>{label}</h3>
      {children}
    </Flex>
  );
}

export default function HistoryStats() {
  const historyStats = useSelector(
    (state: AppState) => state.mainData.historyStats
  );

  if (!historyStats) return <></>;

  const totalMatches = games(historyStats.matchesWinrate);
  const avgMatch = totalMatches
    ? Math.round(historyStats.timePlayed / totalMatches)
    : 0;
  const streak = historyStats.currentStreak;
  const hasSidedGames =
    games(historyStats.gameOneWinrate) + games(historyStats.sidedWinrate) > 0;

  return (
    <div className="history-stats-container">
      <Flex className="stats-panel" style={{ gridArea: "stats" }}>
        <h3 style={{ marginBottom: "8px" }}>Statistics</h3>
        <div className="stats-panel-overflow" style={{ flexDirection: "row" }}>
          <Flex style={{ flexDirection: "column", width: "50%" }}>
            <StatLine label="Matches:">
              <Record wr={historyStats.matchesWinrate} />
            </StatLine>
            <StatLine label="Games:">
              <Record wr={historyStats.gamesWinrate} />
            </StatLine>
            <StatLine label="Time played:">
              <div className="wr-color-number">
                {toDDHHMMSS(historyStats.timePlayed)}
              </div>
            </StatLine>
            <StatLine label="Average match:">
              <div className="wr-color-number">{toMMSS(avgMatch)}</div>
            </StatLine>
            <StatLine label="Best win streak:">
              <div className="wr-color-number">
                {historyStats.bestWinStreak}
              </div>
            </StatLine>
            <StatLine label="Current streak:">
              <div className="wr-color-number">
                {streak.length > 0 ? (
                  <span
                    style={{
                      color: streak.wins ? "var(--color-g)" : "var(--color-r)",
                    }}
                  >
                    {streak.length}
                    {streak.wins ? "W" : "L"}
                  </span>
                ) : (
                  "-"
                )}
              </div>
            </StatLine>
          </Flex>
          <WinratePie title="On the play" wr={historyStats.onThePlayWinrate} />
          <WinratePie title="On the draw" wr={historyStats.onTheDrawWinrate} />
        </div>
      </Flex>

      <Flex className="stats-panel" style={{ gridArea: "ranks" }}>
        <h3 style={{ marginBottom: "8px" }}>Vs opponent rank</h3>
        <div className="stats-panel-overflow">
          {RANK_ROWS.filter(
            (r) =>
              historyStats.rankWinrates[r] &&
              games(historyStats.rankWinrates[r]) > 0
          ).map((r) => (
            <div className="color-wr-line" key={`wr-rank-${r}`}>
              <RankSmall rankTier={r} style={{ margin: "auto 6px auto 0" }} />
              <div style={{ margin: "auto 0" }}>{r}</div>
              <Record wr={historyStats.rankWinrates[r]} />
            </div>
          ))}
        </div>
      </Flex>

      <Flex className="stats-panel" style={{ gridArea: "sided" }}>
        <h3 style={{ marginBottom: "8px" }}>Sideboard performance</h3>
        <div className="stats-panel-overflow">
          {hasSidedGames ? (
            <>
              <div className="color-wr-line">
                <div style={{ margin: "auto 0" }}>Game one</div>
                <Record wr={historyStats.gameOneWinrate} />
              </div>
              <div className="color-wr-line">
                <div style={{ margin: "auto 0" }}>After sideboard</div>
                <Record wr={historyStats.sidedWinrate} />
              </div>
            </>
          ) : (
            <div style={{ color: "var(--color-text-dark)", margin: "auto" }}>
              No best-of-three games in this selection.
            </div>
          )}
        </div>
      </Flex>

      <Flex className="stats-panel" style={{ gridArea: "byColor" }}>
        <h3 style={{ marginBottom: "8px" }}>Winrate by color</h3>
        <div className="stats-panel-overflow">
          <ColorWinrateList
            winrates={historyStats.myColorWinrates}
            keyPrefix="wr-by-col"
          />
        </div>
      </Flex>

      <Flex className="stats-panel" style={{ gridArea: "vsColor" }}>
        <h3 style={{ marginBottom: "8px" }}>Winrate vs color</h3>
        <div className="stats-panel-overflow">
          <ColorWinrateList
            winrates={historyStats.vsColorWinrates}
            keyPrefix="wr-vs-col"
          />
        </div>
      </Flex>
    </div>
  );
}
