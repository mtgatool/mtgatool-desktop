import { CardSet, DbCardDataV2, Metadata } from "../../types";

export class DatabaseClass {
  private static instance: DatabaseClass;

  public metadata: Metadata | undefined;

  constructor() {
    this.setDatabase = this.setDatabase.bind(this);
    this.setDatabaseUnsafely = this.setDatabaseUnsafely.bind(this);
    this.card = this.card.bind(this);
    this.ability = this.ability.bind(this);
  }

  static getInstance(): DatabaseClass {
    if (!DatabaseClass.instance) {
      DatabaseClass.instance = new DatabaseClass();
    }

    return DatabaseClass.instance;
  }

  setDatabase(arg: string): void {
    try {
      this.metadata = JSON.parse(arg);
    } catch (e) {
      console.log("Error parsing metadata", e);
    }
  }

  setDatabaseUnsafely(arg: Metadata): void {
    try {
      this.metadata = arg;
    } catch (e) {
      console.log("Error assigning metadata", e);
    }
  }

  card(grpId: number): DbCardDataV2 | undefined {
    return this.metadata && this.metadata.cards
      ? this.metadata.cards[grpId]
      : undefined;
  }

  cardByName(name: string): DbCardDataV2 | undefined {
    if (this.metadata && this.metadata.cards) {
      const keys = Object.keys(this.metadata.cards);
      for (let index = 0; index < keys.length; index += 1) {
        const card = this.metadata.cards[parseInt(keys[index], 10)];
        if (card.Name == name) {
          return card;
        }
      }
    }
    return undefined;
  }

  ability(abId: number): string | undefined {
    return this.metadata && this.metadata.abilities
      ? this.metadata.abilities[abId]
      : undefined;
  }

  get abilities(): { [id: number]: string } {
    return this.metadata ? this.metadata.abilities : {};
  }

  get cards(): { [id: number]: DbCardDataV2 } {
    return this.metadata !== undefined ? this.metadata.cards : {};
  }

  get cardList(): DbCardDataV2[] {
    return this.cards ? Object.values(this.cards) : ([] as DbCardDataV2[]);
  }

  get sets(): { [id: string]: CardSet } {
    if (!this.metadata) {
      return {};
    }

    return this.metadata.sets;
  }

  get setNames(): Record<string, string> {
    if (!this.metadata) {
      return {};
    }

    return this.metadata.setNames;
  }

  get digitalSets(): string[] {
    if (!this.metadata) {
      return [];
    }

    return this.metadata.digitalSets;
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
    return this.metadata ? parseInt(this.metadata.version, 10) : 0;
  }

  get lang(): string {
    return this.metadata ? this.metadata.language : "en";
  }
}

export default DatabaseClass.getInstance();
