/* eslint-disable no-restricted-globals */
/* eslint-disable no-bitwise */
/* eslint-disable radix */
import Automerge from "automerge";
import { base64ToBinaryDocument, ToolDbMessage } from "mtgatool-db";
import { DbCardDataV2, v2cardsList } from "mtgatool-shared";

import { DbMatch } from "./dbTypes";

export interface Winrate {
  wins: number;
  losses: number;
}

export interface ExploreDeckData {
  wr: number;
  wins: number;
  losses: number;
  gWins: number;
  gLosses: number;
  colors: number;
  ranks: number;
  pilots: string[];
  durations?: number[];
  avgDuration: number;
  colorWinrates: Record<string, Winrate>;
  bestCards: Record<string, number>;
  worstMatchCards: Record<string, number>;
  bestMatchCards: Record<string, number>;
  deck: v2cardsList;
  side: v2cardsList;
  name: string;
  tile: number;
}

export interface ExploreTempCardData {
  cardObj?: DbCardDataV2;
  winrate: Winrate;
  initHandWinrate: Winrate;
  sideInWinrate: Winrate;
  sideOutWinrate: Winrate;
  ranks: number;
  quantities: number[];
  mulligans: number;
  turnsUsed: number[];
  turnsFirstUsed: number[];
}

export interface ExploreCardData {
  id: number;
  name: string;
  winrate: number;
  initHandWinrate: number;
  sideInWinrate: number;
  sideOutWinrate: number;
  total: number;
  initHandTotal: number;
  sideInTotal: number;
  sideOutTotal: number;
  ranks: number;
  mulligans: number;
  avgQuantity: number;
  avgTurnUsed: number;
  avgFirstTurn: number;
}

export interface DbExploreAggregated {
  aggregator: string;
  eventId: string;
  custom: boolean;
  from: number;
  to: number;
  entries: number;
  cards: ExploreCardData[];
  data: Record<string, ExploreDeckData>;
}

export function limitRecord(
  record: Record<string, number>,
  limit: number
): Record<string, number> {
  const newRecord: Record<string, number> = {};
  Object.keys(record)
    .map((k) => {
      const v = record[k];
      return {
        k,
        v,
      };
    })
    .sort((a, b) => {
      if (a.v > b.v) return -1;
      if (b.v > a.v) return 1;
      return 0;
    })
    .splice(0, limit)
    .forEach((d) => {
      newRecord[d.k] = d.v;
    });

  return newRecord;
}

export function beginDataQuery(_day: number, _eventId: string) {
  let crdt: Automerge.FreezeObject<Record<string, number>> = Automerge.init({});

  const data: Record<string, DbMatch> = {};

  let queriedIds: string[] = [];

  function continnuousCheck() {
    self.postMessage({
      type: `EXPLORE_DATA_QUERY_STATE`,
      value: {
        foundKeys: Object.keys(crdt).length,
        queriedKeys: queriedIds.length,
        savedKeys: Object.keys(data).length,
        loadingPercent: Math.floor(
          (queriedIds.length / Object.keys(crdt).length) * 100
        ),
      },
    });

    if (Object.keys(crdt).length === queriedIds.length) {
      self.postMessage({
        type: `EXPLORE_DATA_QUERY`,
        value: data,
      });
    }

    if (Object.keys(crdt).length === 0) {
      setTimeout(() => {
        continnuousCheck();
      }, 500);
    }

    Object.keys(crdt)
      .filter((k) => !queriedIds.includes(k))
      .splice(0, 1)
      .forEach((id) => {
        queriedIds = [...queriedIds, id];
        self.toolDb.getData(id).then((d) => {
          data[id] = d;
          continnuousCheck();
        });
      });
  }

  const handleExploreData = (msg: ToolDbMessage) => {
    if (msg && msg.type === "crdt") {
      const doc = Automerge.load<Record<string, number>>(
        base64ToBinaryDocument(msg.doc)
      );

      try {
        crdt = Automerge.merge(crdt, doc);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  function queryForEvent(ev: string) {
    for (let i = 0; i < _day; i += 1) {
      const currentDay = Math.floor(new Date().getTime() / (86400 * 1000));
      const queryKey = `explore-${currentDay - i}-${ev}`;
      self.toolDb.addKeyListener(queryKey, handleExploreData);
      self.toolDb.subscribeData(queryKey);
    }
  }

  if (_eventId === "aggregated-standard") {
    queryForEvent("Ladder");
    queryForEvent("Play");
    queryForEvent("Constructed_BestOf3");
    queryForEvent("Constructed_Event_2020");
    queryForEvent("Constructed_Event_2021");
    queryForEvent("Constructed_Event_v2");
    queryForEvent("Traditional_Cons_Event_2020");
    queryForEvent("Traditional_Cons_Event_2021");
    queryForEvent("Traditional_Cons_Event_2022");
    queryForEvent("Traditional_Cons_Event_2023");
    queryForEvent("Traditional_Ladder");
    queryForEvent("Standard_Challenge_20230421");
  } else if (_eventId === "aggregated-historic") {
    queryForEvent("Historic_Ladder");
    queryForEvent("Historic_Play");
    queryForEvent("Historic_Event_v2");
    queryForEvent("Historic_Event");
    queryForEvent("Traditional_Historic_Event");
    queryForEvent("Traditional_Historic_Play");
    queryForEvent("Traditional_Historic_Ladder");
  } else if (_eventId === "aggregated-alchemy") {
    queryForEvent("Alchemy_Ladder");
    queryForEvent("Alchemy_Play");
    queryForEvent("Alchemy_Event");
    queryForEvent("Traditional_Alchemy_Event_2022");
    queryForEvent("Traditional_Alchemy_Event_2023");
    queryForEvent("Traditional_Alchemy_Event");
    queryForEvent("Traditional_Alchemy_Play");
    queryForEvent("Traditional_Alchemy_Ladder");
  } else if (_eventId === "aggregated-explorer") {
    queryForEvent("Explorer_Ladder");
    queryForEvent("Explorer_Play");
    queryForEvent("Explorer_Event");
    queryForEvent("Explorer_Event_v2");
    queryForEvent("Traditional_Explorer_Event");
    queryForEvent("Traditional_Explorer_Play");
    queryForEvent("Traditional_Explorer_Ladder");
  } else {
    queryForEvent(_eventId);
  }
  continnuousCheck();
}
