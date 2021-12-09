import { CardStats } from "./collectionStats";
import CountStats from "./CountStats";

export default class SetStats {
  public set: string;

  public cards: { [key: string]: CardStats[] }[];

  public common: CountStats;

  public uncommon: CountStats;

  public rare: CountStats;

  public mythic: CountStats;

  public token: CountStats;

  public boosters: number;

  public boosterRares: number;

  public boosterMythics: number;

  constructor(set: string) {
    this.set = set;
    this.cards = [];
    this.common = new CountStats();
    this.uncommon = new CountStats();
    this.rare = new CountStats();
    this.mythic = new CountStats();
    this.token = new CountStats();
    this.boosters = 0;
    this.boosterRares = 0;
    this.boosterMythics = 0;
  }

  get all(): CountStats {
    return [
      new CountStats(),
      this.common,
      this.uncommon,
      this.rare,
      this.mythic,
    ].reduce((acc, c) => {
      acc.owned += c.owned;
      acc.total += c.total;
      acc.unique += c.unique;
      acc.complete += c.complete;
      acc.wanted += c.wanted;
      acc.uniqueOwned += c.uniqueOwned;
      return acc;
    });
  }
}
