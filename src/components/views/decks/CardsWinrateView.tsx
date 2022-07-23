/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable no-nested-ternary */
/* eslint-disable radix */
import { useMemo, useState } from "react";
import {
  compareCards,
  DbCardData,
  CardObject,
  database,
  Deck,
} from "mtgatool-shared";

import { useSortBy, useTable } from "react-table";

import Section from "../../ui/Section";

import Button from "../../ui/Button";
import getWinrateClass from "../../../utils/getWinrateClass";
import CardTile from "../../CardTile";
import { CardWinrateData, StatsDeck } from "../../../types/dbTypes";
import { AggregatedStats } from "../../../utils/aggregateStats";
import Select from "../../ui/Select";

function getWinrateValue(wins: number, losses: number): number {
  return wins + losses == 0 ? -1 : Math.round((100 / (wins + losses)) * wins);
}

function sortByLastUsed(a: StatsDeck, b: StatsDeck) {
  if (a.lastUsed > b.lastUsed) return -1;
  if (a.lastUsed < b.lastUsed) return 1;
  return 0;
}

interface LineData {
  wr: CardWinrateData;
  cardObj: DbCardData;
  quantity: number;
  name: string;
  winrate: number;
  initHandWinrate: number;
  sidedIn: number;
  sidedOut: number;
  sideInWinrate: number;
  sideOutWinrate: number;
  avgTurn: number;
  avgFirstTurn: number;
  mulligans: number;
}

function cardWinrateLineData(
  winrates: Record<number, CardWinrateData>,
  cardObj: DbCardData,
  quantity: number,
  name: string
): LineData {
  const wr = winrates[cardObj.id];
  const winrate = getWinrateValue(wr.wins, wr.losses);
  const sideInWinrate = getWinrateValue(wr.sideInWins, wr.sideInLosses);
  const initHandWinrate = getWinrateValue(wr.initHandWins, wr.initHandsLosses);
  const sideOutWinrate = getWinrateValue(wr.sideOutWins, wr.sideOutLosses);

  const sum = wr.turnsUsed.reduce((a, b) => a + b, 0);
  const avgTurn = sum / wr.turnsUsed.length || 0;

  const firstSum = wr.turnsFirstUsed.reduce((a, b) => a + b, 0);
  const avgFirstTurn = firstSum / wr.turnsFirstUsed.length || 0;

  return {
    wr,
    cardObj,
    quantity,
    name,
    winrate,
    initHandWinrate,
    sidedIn: wr.sidedIn,
    sidedOut: wr.sidedOut,
    sideInWinrate,
    sideOutWinrate,
    avgTurn,
    avgFirstTurn,
    mulligans: wr.mulligans,
  };
}

function cardWinrateLine(line: LineData): JSX.Element {
  const {
    wr,
    cardObj,
    quantity,
    name,
    winrate,
    initHandWinrate,
    sidedIn,
    sidedOut,
    sideInWinrate,
    sideOutWinrate,
    avgTurn,
    avgFirstTurn,
    mulligans,
  } = line;

  return (
    <div className="card-wr-line" key={`${cardObj.id}-${name}`}>
      <div className="card-wr-line-card">
        <CardTile
          indent="c"
          isHighlighted={false}
          isSideboard={false}
          showWildcards={false}
          card={cardObj}
          key={`main-${name}-${cardObj.id}`}
          quantity={{ type: "NUMBER", quantity }}
        />
      </div>
      <div
        title={`sample size: ${wr.wins + wr.losses}`}
        className={`${getWinrateClass(
          winrate / 100,
          true
        )} ${"card-wr-item"} ${"card-wr-line-wr"}`}
      >
        {winrate >= 0 ? `${winrate}%` : "-"}
      </div>
      <div
        title={`sample size: ${wr.initHandWins + wr.initHandsLosses}`}
        className={`${getWinrateClass(
          initHandWinrate / 100,
          true
        )} ${"card-wr-item"} ${"card-wr-line-hand-wr"}`}
      >
        {initHandWinrate >= 0 ? `${initHandWinrate}%` : "-"}
      </div>
      <div className="card-wr-item card-wr-line-mulls">{mulligans}</div>
      <div className="card-wr-item card-wr-line-sided-in">{sidedIn}</div>
      <div className="card-wr-item card-wr-line-sided-out">{sidedOut}</div>
      <div
        title={`sample size: ${wr.sideInWins + wr.sideInLosses}`}
        className={`${getWinrateClass(
          sideInWinrate / 100,
          true
        )} ${"card-wr-item"} ${"card-wr-line-sided-in-wr"}`}
      >
        {sideInWinrate >= 0 ? `${sideInWinrate}%` : "-"}
      </div>
      <div
        title={`sample size: ${wr.sideOutWins + wr.sideOutLosses}`}
        className={`${getWinrateClass(
          sideOutWinrate / 100,
          true
        )} ${"card-wr-item"} ${"card-wr-line-sided-out-wr"}`}
      >
        {sideOutWinrate >= 0 ? `${sideOutWinrate}%` : "-"}
      </div>
      <div
        title={`sample size: ${wr.turnsUsed.length}`}
        className={`card-wr-item card-wr-line-avg-turn"}`}
      >
        {avgTurn.toFixed(2)}
      </div>
      <div
        title={`sample size: ${wr.turnsFirstUsed.length}`}
        className={`${"card-wr-item"} ${"card-wr-line-avg-first"}`}
      >
        {avgFirstTurn.toFixed(2)}
      </div>
    </div>
  );
}

const ALL_VERSIONS = 99;

interface CardsWinratesViewProps {
  dbDeck: StatsDeck;
  fullStats: AggregatedStats;
  setRegularView: () => void;
}

export default function CardsWinratesView(
  props: CardsWinratesViewProps
): JSX.Element {
  const { dbDeck, fullStats, setRegularView } = props;

  const allVStats: StatsDeck = {
    id: "",
    deckTileId: 0,
    name: "",
    mainDeck: [],
    sideboard: [],
    playerId: "",
    deckHash: "",
    matches: {},
    colors: 0,
    lastUsed: 0,
    stats: {
      gameWins: 0,
      gameLosses: 0,
      matchWins: 0,
      matchLosses: 0,
    },
    totalGames: 0,
    cardWinrates: {},
    winrate: 0,
  };

  const decks = fullStats.decks[dbDeck.id];

  const allDecksStats = decks
    .map((d) => fullStats.deckIndex[d])
    .sort(sortByLastUsed);

  const [currentDeckVersion, setCurrentDeckVersion] = useState(0);

  let allGames = 0;
  const deckHashesToName = allDecksStats.map((v, index) => {
    const lastUsed = new Date(v.lastUsed);
    allGames += v.totalGames;

    allVStats.id = v.id;
    allVStats.deckTileId = v.deckTileId;
    allVStats.name = v.name;
    v.mainDeck.forEach((c) => {
      let found = false;
      allVStats.mainDeck.forEach((cc) => {
        if (cc.id === c.id) found = true;
      });

      if (!found) allVStats.mainDeck.push(c);
    });

    v.sideboard.forEach((c) => {
      let found = false;
      allVStats.sideboard.forEach((cc) => {
        if (cc.id === c.id) found = true;
      });

      if (!found) allVStats.sideboard.push(c);
    });

    Object.keys(v.cardWinrates).forEach((cid: any) => {
      if (!allVStats.cardWinrates[cid]) {
        allVStats.cardWinrates[cid] = { ...v.cardWinrates[cid] };
      } else {
        allVStats.cardWinrates[cid].initHandWins +=
          v.cardWinrates[cid].initHandWins;
        allVStats.cardWinrates[cid].initHandsLosses +=
          v.cardWinrates[cid].initHandsLosses;
        allVStats.cardWinrates[cid].losses += v.cardWinrates[cid].losses;
        allVStats.cardWinrates[cid].wins += v.cardWinrates[cid].losses;
        allVStats.cardWinrates[cid].mulligans += v.cardWinrates[cid].mulligans;
        allVStats.cardWinrates[cid].sideInLosses +=
          v.cardWinrates[cid].sideInLosses;
        allVStats.cardWinrates[cid].sideInWins +=
          v.cardWinrates[cid].sideInWins;
        allVStats.cardWinrates[cid].sideOutLosses +=
          v.cardWinrates[cid].sideOutLosses;
        allVStats.cardWinrates[cid].sideOutWins +=
          v.cardWinrates[cid].sideOutWins;
        allVStats.cardWinrates[cid].sidedIn += v.cardWinrates[cid].sidedIn;
        allVStats.cardWinrates[cid].sidedOut += v.cardWinrates[cid].sidedOut;
        allVStats.cardWinrates[cid].turnsFirstUsed = [
          ...v.cardWinrates[cid].turnsFirstUsed,
          ...allVStats.cardWinrates[cid].turnsFirstUsed,
        ];
        allVStats.cardWinrates[cid].turnsUsed = [
          ...v.cardWinrates[cid].turnsUsed,
          ...allVStats.cardWinrates[cid].turnsUsed,
        ];
      }
    });

    return `v${allDecksStats.length - index} - ${lastUsed.toDateString()} - ${
      v.totalGames
    } games`;
  });

  deckHashesToName[ALL_VERSIONS] = `All versions - ${allGames} games`;

  const deck =
    currentDeckVersion === ALL_VERSIONS
      ? new Deck({}, allVStats.mainDeck || [], allVStats.sideboard || [])
      : new Deck(
          {},
          allDecksStats[currentDeckVersion]?.mainDeck || [],
          allDecksStats[currentDeckVersion]?.sideboard || []
        );

  const data = useMemo(() => {
    const winrates =
      currentDeckVersion === ALL_VERSIONS
        ? allVStats.cardWinrates
        : allDecksStats[currentDeckVersion].cardWinrates || {};

    console.log(winrates);

    if (!winrates) return [];
    return Object.keys(winrates).map((grpid) => {
      const cardObj = database.card(parseInt(grpid));
      return cardObj
        ? cardWinrateLineData(winrates, cardObj, 1, cardObj.name)
        : {
            cardObj: null,
          };
    });
  }, [fullStats, currentDeckVersion]);

  deck.sortMainboard(compareCards);
  deck.sortSideboard(compareCards);

  const columns = useMemo(
    () => [
      {
        Header: "Mainboard",
        accessor: "name",
        class: "card-wr-line-card",
      },
      {
        Header: "Cast WR",
        accessor: "winrate",
        class: "card-wr-line-wr",
      },
      {
        Header: "First Hand WR",
        accessor: "initHandWinrate",
        class: "card-wr-line-hand-wr",
      },
      {
        Header: "Mulliganed",
        accessor: "mulligans",
        class: "card-wr-line-mulls",
      },
      {
        Header: "Sided In",
        accessor: "sidedIn",
        class: "card-wr-line-sided-in",
      },
      {
        Header: "Sided Out",
        accessor: "sidedOut",
        class: "card-wr-line-sided-out",
      },
      {
        Header: "Sided In WR",
        accessor: "sideInWinrate",
        class: "card-wr-line-sided-in-wr",
      },
      {
        Header: "Sided Out WR",
        accessor: "sideOutWinrate",
        class: "card-wr-line-sided-out-wr",
      },
      {
        Header: "Avg. turn",
        accessor: "avgTurn",
        class: "card-wr-line-avg-turn",
      },
      {
        Header: "Avg. First Turn",
        accessor: "avgFirstTurn",
        class: "card-wr-line-avg-first",
      },
    ],
    []
  ) as any;

  const { headerGroups, rows, prepareRow } = useTable(
    {
      columns,
      data,
    },
    useSortBy
  );

  return (
    <div className="cards-wr-view-grid">
      <Section
        style={{
          padding: "16px",
          gridArea: "controls",
          justifyContent: "center",
        }}
      >
        <Button text="Normal View" onClick={setRegularView} />
      </Section>
      <Section
        style={{
          gridArea: "desc",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Select
          style={{ margin: "8px auto 0", width: "300px" }}
          options={deckHashesToName}
          current={deckHashesToName[currentDeckVersion]}
          callback={(opt: string): void => {
            setCurrentDeckVersion(deckHashesToName.findIndex((v) => v === opt));
          }}
        />
        <div
          className="settings-note"
          style={{ margin: "auto", padding: "16px", textAlign: "center" }}
        >
          All winrates shown correspond to the times when the card in question
          was cast during a game, except for the &quot;Sided out WR&quot;
          column.
        </div>
      </Section>
      <Section style={{ padding: "16px", gridArea: "table" }}>
        <div className="card-wr-stats">
          <div className="card-wr-line">
            {headerGroups.map((headerGroup: any) => {
              return headerGroup.headers.map((column: any) => {
                return (
                  <div
                    key={`header-${column.class}`}
                    className={`card-wr-item ${column.class}`}
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                  >
                    {column.Header}
                    <div
                      className={
                        column.isSorted
                          ? column.isSortedDesc
                            ? "sort-desc"
                            : "sort-asc"
                          : ""
                      }
                    />
                  </div>
                );
              });
            })}
          </div>
          {rows.map((row: any) => {
            prepareRow(row);
            const q = deck
              .getMainboard()
              .countFilter(
                "quantity",
                (card: CardObject) => row.original.cardObj?.id == card.id
              );
            if (q > 0 && row.original.cardObj !== null) {
              return cardWinrateLine({ ...row.original, quantity: q });
            }
            return <></>;
          })}
          <div className="card-wr-line">
            {headerGroups.map((headerGroup: any) => {
              return headerGroup.headers.map((column: any) => {
                return (
                  <div
                    key={`header-line-${column.class}`}
                    className={`card-wr-item ${column.class}`}
                  >
                    {column.Header == "Mainboard" ? "Sideboard" : ""}
                  </div>
                );
              });
            })}
          </div>
          {rows.map((row: any) => {
            prepareRow(row);
            const q = deck
              .getSideboard()
              .countFilter(
                "quantity",
                (card: CardObject) => row.original.cardObj?.id == card.id
              );
            if (q > 0 && row.original.cardObj !== null) {
              return cardWinrateLine({ ...row.original, quantity: q });
            }
            return <></>;
          })}
        </div>
      </Section>
    </div>
  );
}
