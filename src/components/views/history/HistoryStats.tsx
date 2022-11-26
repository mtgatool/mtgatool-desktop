/* eslint-disable radix */
import { Colors, formatPercent } from "mtgatool-shared";
import { COLORLESS } from "mtgatool-shared/dist/shared/constants";
import { PieChart } from "react-minimal-pie-chart";
import { useSelector } from "react-redux";

import { AppState } from "../../../redux/stores/rendererStore";
import { Winrate } from "../../../utils/aggregateStats";
import { toDDHHMMSS } from "../../../utils/dateTo";
import getWinrateClass from "../../../utils/getWinrateClass";
import Flex from "../../Flex";
import ManaCost from "../../ManaCost";

function getWinrateValue(wr: Winrate) {
  return wr.losses + wr.wins > 0 ? wr.wins / (wr.losses + wr.wins) : 0;
}

export default function HistoryStats() {
  const historyStats = useSelector(
    (state: AppState) => state.mainData.historyStats
  );

  if (!historyStats) return <></>; // Maybe show a loading spinner or something like that instead?

  const matchesWinrate = getWinrateValue(historyStats.matchesWinrate);

  const gamesWinrate = getWinrateValue(historyStats.gamesWinrate);

  const playColorPie = [
    {
      title: "Wins",
      value: historyStats.onThePlayWinrate.wins,
      color: "#AABEDF",
    },
    {
      title: "Losses",
      value: historyStats.onThePlayWinrate.losses,
      color: "#5F6A7B",
    },
  ];

  const drawColorPie = [
    {
      title: "Wins",
      value: historyStats.onTheDrawWinrate.wins,
      color: "#AABEDF",
    },
    {
      title: "Losses",
      value: historyStats.onTheDrawWinrate.losses,
      color: "#5F6A7B",
    },
  ];

  return (
    <div className="history-stats-container">
      <Flex className="stats-panel" style={{ gridArea: "stats" }}>
        <h3 style={{ marginBottom: "8px" }}>Statistics</h3>
        <div className="stats-panel-overflow" style={{ flexDirection: "row" }}>
          <Flex style={{ flexDirection: "column", width: "50%" }}>
            <Flex style={{ margin: "8px 0" }}>
              <h3>Matches:</h3>
              <div className="wr-color-number">
                {historyStats.matchesWinrate.wins}:
                {historyStats.matchesWinrate.losses} (
                <span className={getWinrateClass(matchesWinrate, true)}>
                  {formatPercent(matchesWinrate)}
                </span>
                )
              </div>
            </Flex>
            <Flex style={{ margin: "8px 0" }}>
              <h3>Games:</h3>
              <div className="wr-color-number">
                {historyStats.gamesWinrate.wins}:
                {historyStats.gamesWinrate.losses} (
                <span className={getWinrateClass(gamesWinrate, true)}>
                  {formatPercent(gamesWinrate)}
                </span>
                )
              </div>
            </Flex>
            <Flex style={{ margin: "8px 0" }}>
              <h3>Time played:</h3>
              <div className="wr-color-number">
                {toDDHHMMSS(historyStats.timePlayed)}
              </div>
            </Flex>
          </Flex>
          <Flex className="winrate-pie">
            <h3>On the play</h3>
            <h3 className="pie-center-text">
              {formatPercent(getWinrateValue(historyStats.onThePlayWinrate))}
            </h3>
            <PieChart
              viewBoxSize={[180, 180]}
              center={[90, 90]}
              radius={70}
              lineWidth={33}
              startAngle={270}
              data={playColorPie}
            />
          </Flex>
          <Flex className="winrate-pie">
            <h3>On the draw</h3>
            <h3 className="pie-center-text">
              {formatPercent(getWinrateValue(historyStats.onTheDrawWinrate))}
            </h3>
            <PieChart
              viewBoxSize={[180, 180]}
              center={[90, 90]}
              radius={70}
              lineWidth={33}
              startAngle={270}
              data={drawColorPie}
            />
          </Flex>
        </div>
      </Flex>
      <Flex className="stats-panel" style={{ gridArea: "vsColor" }}>
        <h3 style={{ marginBottom: "8px" }}>Winrate vs color</h3>
        <div className="stats-panel-overflow">
          {Object.keys(historyStats.vsColorWinrates)
            .filter((c) => {
              const w = historyStats.vsColorWinrates[c as any];
              return w.wins + w.losses > 5;
            })
            .sort((a, b) => {
              const wra = getWinrateValue(
                historyStats.vsColorWinrates[a as any]
              );
              const wrb = getWinrateValue(
                historyStats.vsColorWinrates[b as any]
              );
              if (wra > wrb) return -1;
              if (wra < wrb) return 1;
              return 0;
            })
            .map((color) => {
              const wr = historyStats.vsColorWinrates[color as any];
              const arrCol = new Colors();
              arrCol.addFromBits(parseInt(color));

              const totalWinrate = getWinrateValue(wr);
              return (
                <div className="color-wr-line" key={`wr-vs-col-${color}`}>
                  <ManaCost
                    colors={arrCol.getBits() !== 0 ? arrCol.get() : [COLORLESS]}
                  />
                  <div className="wr-color-number">
                    {wr.wins}:{wr.losses} (
                    <span className={getWinrateClass(totalWinrate, true)}>
                      {formatPercent(totalWinrate)}
                    </span>
                    )
                  </div>
                </div>
              );
            })}
        </div>
      </Flex>
      <Flex className="stats-panel" style={{ gridArea: "byColor" }}>
        <h3 style={{ marginBottom: "8px" }}>Winrate by color</h3>
        <div className="stats-panel-overflow">
          {Object.keys(historyStats.myColorWinrates)
            .filter((c) => {
              const w = historyStats.myColorWinrates[c as any];
              return w.wins + w.losses > 5;
            })
            .sort((a, b) => {
              const wra = getWinrateValue(
                historyStats.myColorWinrates[a as any]
              );
              const wrb = getWinrateValue(
                historyStats.myColorWinrates[b as any]
              );
              if (wra > wrb) return -1;
              if (wra < wrb) return 1;
              return 0;
            })
            .map((color) => {
              const wr = historyStats.myColorWinrates[color as any];
              const arrCol = new Colors();
              arrCol.addFromBits(parseInt(color));

              const totalWinrate = getWinrateValue(wr);
              return (
                <div className="color-wr-line" key={`wr-by-col-${color}`}>
                  <ManaCost
                    colors={arrCol.getBits() !== 0 ? arrCol.get() : [COLORLESS]}
                  />
                  <div className="wr-color-number">
                    {wr.wins}:{wr.losses} (
                    <span className={getWinrateClass(totalWinrate, true)}>
                      {formatPercent(totalWinrate)}
                    </span>
                    )
                  </div>
                </div>
              );
            })}
        </div>
      </Flex>
    </div>
  );
}
