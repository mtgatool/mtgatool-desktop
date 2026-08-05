/* eslint-disable class-methods-use-this */
import { CardSet, DbCardDataV2 } from "../../types";
import cardsDb from "../cardsDb/cardsDbClient";

/**
 * The card database, as the app has always addressed it.
 *
 * This used to hold a parsed copy of a ~24MB JSON file — one per window, plus a
 * second copy retained by the webpack module cache. It is now a thin facade
 * over the SQLite worker, which holds the only copy.
 *
 * The shape is unchanged on purpose: `database.card(grpId)` is called in ~65
 * places, several of them inside sort comparators, which cannot await. So the
 * accessor stays synchronous and reads the client's cache.
 *
 * The new part of the contract is that a card has to have been *fetched*
 * before it can be read. Anything rendering a known set of cards should ask
 * for them first — `useCards(ids)` in a component, `await cardsDb.cards(ids)`
 * anywhere else — and `card()` then answers from the cache. A card that has
 * not been fetched reads as undefined, exactly as an unknown grpId always did.
 */
export class DatabaseClass {
  private static instance: DatabaseClass;

  constructor() {
    this.card = this.card.bind(this);
    this.ability = this.ability.bind(this);
  }

  static getInstance(): DatabaseClass {
    if (!DatabaseClass.instance) {
      DatabaseClass.instance = new DatabaseClass();
    }
    return DatabaseClass.instance;
  }

  /** A card, if it has been fetched. Synchronous by necessity. */
  card(grpId: number): DbCardDataV2 | undefined {
    return cardsDb.cachedCard(grpId) ?? undefined;
  }

  /** Ability text, if it has been fetched. Fetches on a miss for next time. */
  ability(abId: number): string | undefined {
    return cardsDb.cachedAbility(abId);
  }

  get abilities(): { [id: number]: string } {
    return cardsDb.cachedAbilities;
  }

  /**
   * Sets and their aliases are small — 238 and 672 — so unlike cards they are
   * loaded eagerly and read straight off the client.
   */
  get sets(): { [id: string]: CardSet } {
    return cardsDb.sets;
  }

  get setNames(): Record<string, string> {
    return cardsDb.setNames;
  }

  get digitalSets(): string[] {
    return cardsDb.digitalSets;
  }

  get sortedSetCodes(): string[] {
    const setCodes = Object.keys(this.sets);
    setCodes.sort(
      (a, b) =>
        new Date(this.sets[b].release).getTime() -
        new Date(this.sets[a].release).getTime()
    );
    return setCodes;
  }

  get version(): number {
    return cardsDb.version;
  }

  get lang(): string {
    return cardsDb.language;
  }

  /** When the shipped database was generated, as a unix ms timestamp. */
  get updated(): number {
    return cardsDb.updated;
  }

  /** How many cards the database holds. Counted at load, not by holding them. */
  get cardCount(): number {
    return cardsDb.cardCount;
  }

  /** Whether the database is loaded and can answer at all. */
  get ok(): boolean {
    return cardsDb.available;
  }
}

const database = DatabaseClass.getInstance();

// Dev-only handle, same idea as `window.store`.
if (process.env.NODE_ENV === "development") {
  (window as any).__db = database;
}

export default database;
