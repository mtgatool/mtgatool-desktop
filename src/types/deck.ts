export interface CardObject {
  id: number;
  quantity: number;
  chance?: number;
  dfcId?: string;
  grpId?: number;
  measurable?: boolean;
}

export interface V4CardObject {
  cardId: number;
  quantity: number;
}

export type v2cardsList = Array<CardObject>;

export type v3cardsList = Array<number>;

export type v4cardsList = Array<V4CardObject>;

export type anyCardsList = v2cardsList | v3cardsList;

export function isV2CardsList(
  list: Readonly<anyCardsList>
): list is Readonly<v2cardsList> {
  const first = (list as v2cardsList)[0];
  return first && first.quantity !== undefined;
}

interface CardSkin {
  grpId: number;
  ccv: string;
}

export interface DeckChange {
  id: string;
  deckId: string;
  date: string;
  changesMain: CardObject[];
  changesSide: CardObject[];
  previousMain: v2cardsList;
  previousSide: v2cardsList;
  newDeckHash: string;
}

export interface ColorsAmmount {
  total: number;
  w: number;
  u: number;
  b: number;
  r: number;
  g: number;
  c: number;
}

export interface MissingWildcards {
  rare: number;
  common: number;
  uncommon: number;
  mythic: number;
}

interface BasicDeck {
  id: string;
  commandZoneGRPIds?: number[];
  companionGRPId?: number;
  mainDeck: anyCardsList;
  sideboard: anyCardsList;
  name: string;
  lastUpdated: string;
  deckTileId: number;
  format: string;
}

export interface InternalDeck extends BasicDeck {
  mainDeck: v2cardsList;
  sideboard: v2cardsList;
  arenaMain?: Readonly<v2cardsList>;
  arenaSide?: Readonly<v2cardsList>;
  colors?: number;
  type: "InternalDeck";
}

export interface ArenaV3Deck extends BasicDeck {
  mainDeck: v3cardsList;
  sideboard: v3cardsList;
  reducedSideboard: v3cardsList | null;
  isValid: boolean;
  lockedForUse: boolean;
  lockedForEdit: boolean;
  reourceId?: string;
  cardSkins: CardSkin[];
  cardBack: null | string;
  commandZoneGRPIds: [];
  companionGRPId: number;
  type: "ArenaV3Deck";
}

/**
 * The deck shape sent by `Event_SetDeckV2` and `DeckUpsertDeckV3`: a summary
 * beside the lists, each list an array of `{ cardId, quantity }`.
 *
 * Only the fields both labels actually carry are declared. `DeckUpsertDeckV3`
 * sends no `ReducedSideboard`, so nothing may depend on it.
 */
export interface ArenaV4DeckPayload {
  Summary: {
    DeckId: string;
    Name?: string;
    DeckTileId: number;
  };
  Deck: {
    MainDeck: v4cardsList;
    Sideboard: v4cardsList;
    CommandZone: v4cardsList;
    Companions: v4cardsList;
  };
}
