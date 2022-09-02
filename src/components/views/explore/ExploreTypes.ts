export interface BestCards {
  copies: number;
  id: number;
  rating: number;
}

export const MODE_EXPLORE_DECKS = 2;
export const MODE_EXPLORE_CARDS = 3;
export const MODE_DECKVIEW = 5;

export type Modes =
  | typeof MODE_EXPLORE_DECKS
  | typeof MODE_EXPLORE_CARDS
  | typeof MODE_DECKVIEW;
