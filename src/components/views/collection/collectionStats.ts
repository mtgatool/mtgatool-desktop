import { Colors, database } from "mtgatool-shared";

import { makeDefaultUUIDData } from "../../../redux/slices/mainDataSlice";
import store from "../../../redux/stores/rendererStore";

import SetStats from "./SetsStats";

export const ALL_CARDS = "All cards";
export const SINGLETONS = "Singletons (at least one)";
export const FULL_SETS = "Full sets (all 4 copies)";

// assume 1/8 of packs have a mythic
export const chanceBoosterHasMythic = 0.125;
export const chanceBoosterHasRare = 1 - chanceBoosterHasMythic;
// assume (1/24 mythic + 1/24 rare) WC instead of card
export const chanceNotWildCard = 11 / 12;

export function estimateBoosterRares(boosterCount: number): number {
  return boosterCount * chanceBoosterHasRare * chanceNotWildCard;
}

export function estimateBoosterMythics(boosterCount: number): number {
  return boosterCount * chanceBoosterHasMythic * chanceNotWildCard;
}

export interface CardStats {
  id: number;
  owned: number;
  wanted: number;
}

export interface CollectionStats {
  [set: string]: SetStats;
}

export function getCollectionStats(cardIds: number[]): CollectionStats {
  const state = store.getState();
  const { currentUUID } = state.mainData;
  const uuidData = state.mainData.uuidData[currentUUID];

  const noUndefUuidData = uuidData || makeDefaultUUIDData();
  // uuidData[currentUUID]?.cards || defaultCardsData

  const stats: any = {
    complete: new SetStats("complete"),
  };

  const { cards } = noUndefUuidData;

  Object.values(database.sets).forEach((setObj) => {
    const setCode = setObj.arenacode.toLowerCase();
    const setStats = new SetStats(setCode);
    setStats.boosters = noUndefUuidData.inventory.Boosters.filter(
      ({ CollationId }) => setObj.collation === CollationId
    ).reduce(
      (accumulator: number, booster: { CollationId: number; Count: number }) =>
        accumulator + booster.Count,
      0
    );
    setStats.boosterRares = estimateBoosterRares(setStats.boosters);
    setStats.boosterMythics = estimateBoosterMythics(setStats.boosters);
    stats[setCode] = setStats;
  });

  cardIds.forEach((cardId) => {
    const card = database.card(cardId);
    if (!card) return;
    if (card.rarity === "land" || card.rarity === "token") return;

    const cardSet =
      card.set_digital === ""
        ? card.set.toLowerCase()
        : card.set_digital.toLowerCase();

    const obj: CardStats = {
      id: card.id,
      owned: 0,
      wanted: 0,
    };

    // add to totals
    if (!stats[cardSet] || stats[cardSet][card.rarity] === undefined) {
      console.log(card, cardSet, card.rarity);
      return;
    }

    stats[cardSet][card.rarity].total += 4;
    stats[cardSet][card.rarity].unique += 1;
    stats.complete[card.rarity].total += 4;
    stats.complete[card.rarity].unique += 1;

    // add cards we own
    if (cards.cards[card.id] !== undefined) {
      const owned = cards.cards[card.id];
      obj.owned = owned;
      stats[cardSet][card.rarity].owned += owned;
      stats[cardSet][card.rarity].uniqueOwned += 1;
      stats.complete[card.rarity].owned += owned;
      stats.complete[card.rarity].uniqueOwned += 1;

      // count complete sets we own
      if (owned == 4) {
        stats[cardSet][card.rarity].complete += 1;
        stats.complete[card.rarity].complete += 1;
      }
    }

    const col = new Colors();
    (window as any).Colors = Colors;
    col.addFromCost(card.cost);
    const colorIndex = col.getBaseColor();

    if (!stats[cardSet].cards[colorIndex]) {
      stats[cardSet].cards[colorIndex] = {};
    }

    if (!stats[cardSet].cards[colorIndex][card.rarity]) {
      stats[cardSet].cards[colorIndex][card.rarity] = [];
    }

    stats[cardSet].cards[colorIndex][card.rarity].push(obj);
  });

  return stats;
}
