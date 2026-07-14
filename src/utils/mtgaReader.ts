/**
 * Typed shapes returned by the high-level mtga-reader readers (mtga-reader
 * >= 0.1.6). This module is intentionally **types only** for now: the Electron
 * app still ships mtga-reader 0.1.5, whose napi build predates these readers.
 *
 * When the reader package is bumped, add the runtime facade here (Electron path
 * = `__non_webpack_require__("mtga-reader")`, calling readAccount/readCollection/
 * readInventory/readDecks/readRanks against a cached session). The cloud sync
 * layer (`src/data/cloudSync.ts`, `upsertDbDecks.ts`) already consumes these
 * types, so wiring the implementation later is drop-in.
 */

export interface ReaderCardCount {
  grpId: number;
  qty: number;
}

export interface ReaderDeckPile {
  pile: number;
  pileName: "Main" | "Sideboard" | "CommandZone" | "Companions" | string;
  total: number;
  cards: ReaderCardCount[];
}

export interface ReaderDeck {
  name: string;
  deckId: string;
  description?: string;
  tileId?: number;
  attributes: Record<string, string>;
  piles: ReaderDeckPile[];
}

export interface ReaderDecks {
  count: number;
  decks: ReaderDeck[];
}

export interface ReaderRank {
  seasonOrdinal?: number;
  class: string;
  classValue: number;
  level?: number;
  step?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  percentile?: string;
  leaderboardPlace?: number;
}

export interface ReaderRanks {
  playerId?: string;
  constructed: ReaderRank;
  limited: ReaderRank;
}

export interface ReaderAccount {
  displayName?: string;
  accountId?: string;
  personaId?: string;
  gameId?: string;
  email?: string;
  externalId?: string;
  countryCode?: string;
  accessToken?: string;
}

export interface ReaderCollection {
  count: number;
  cards: ReaderCardCount[];
}

export interface ReaderInventory {
  gems?: number;
  gold?: number;
  wildcards: {
    common?: number;
    uncommon?: number;
    rare?: number;
    mythic?: number;
  };
  wcTrackPosition?: number;
  vaultProgress?: number;
  basicLandSet?: string;
  latestBasicLandSet?: string;
}
