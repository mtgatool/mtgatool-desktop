export default class CountStats {
  public owned: number;

  public total: number;

  public unique: number;

  public complete: number;

  public wanted: number;

  public uniqueWanted: number;

  public uniqueOwned: number;

  constructor(
    owned = 0,
    total = 0,
    unique = 0,
    complete = 0,
    wanted = 0,
    uniqueWanted = 0,
    uniqueOwned = 0
  ) {
    this.owned = owned;
    this.total = total;
    this.unique = unique;
    this.complete = complete; // all 4 copies of a card
    this.wanted = wanted;
    this.uniqueWanted = uniqueWanted;
    this.uniqueOwned = uniqueOwned;
  }

  get percentage(): number {
    if (this.total) {
      return (this.owned / this.total) * 100;
    }
    return 100;
  }
}
