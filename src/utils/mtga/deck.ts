/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
import { DEFAULT_TILE } from "../../constants";
import {
  anyCardsList,
  CardObject,
  DbCardDataV2,
  InternalDeck,
} from "../../types";
import compareCards from "../compareCards";
import objectClone from "../objectClone";
import sha1 from "../sha1";
import CardsList from "./cardsList";
import Colors from "./colors";
import database from "./database";

class Deck {
  private mainboard: CardsList;

  private sideboard: CardsList;

  private commandZoneGRPIds: number[];

  private companionGRPId: number | null;

  private name: string;

  public id: string;

  public lastUpdated: string;

  public tile: number;

  public _colors: Colors;

  public format: string;

  constructor(
    mtgaDeck: Partial<InternalDeck> = {},
    main?: anyCardsList,
    side?: anyCardsList
  ) {
    // Putting these as default argument values works in tests, but throws an
    // undefined reference error in production.
    main = main ?? mtgaDeck.mainDeck ?? [];
    side = side ?? mtgaDeck.sideboard ?? [];
    this.mainboard = new CardsList(main);
    this.sideboard = new CardsList(side);
    this.commandZoneGRPIds = mtgaDeck.commandZoneGRPIds ?? [];
    this.companionGRPId = mtgaDeck.companionGRPId ?? null;
    this.name = mtgaDeck.name ?? "";
    this.id = mtgaDeck.id ?? "";
    this.lastUpdated = mtgaDeck.lastUpdated ?? "";
    this.tile = mtgaDeck.deckTileId ? mtgaDeck.deckTileId : DEFAULT_TILE;
    this._colors = this.getColors();
    this.format = mtgaDeck.format ?? "";
    return this;
  }

  /**
   * returns the colors of this deck, or creates a new colors object
   * if not defined yet.
   * */
  get colors(): Colors {
    return this._colors;
  }

  /**
   * Sort the mainboard of this deck.
   * @param func sort function.
   */
  sortMainboard(func: (a: CardObject, b: CardObject) => number): void {
    this.mainboard.get().sort(func);
  }

  /**
   * Sort the sideboard of this deck.
   * @param func sort function.
   */
  sortSideboard(func: (a: CardObject, b: CardObject) => number): void {
    this.sideboard.get().sort(func);
  }

  getMainboard(): CardsList {
    return this.mainboard;
  }

  getSideboard(): CardsList {
    return this.sideboard;
  }

  setMainboard(list: CardsList): void {
    this.mainboard = list;
  }

  setSideboard(list: CardsList): void {
    this.sideboard = list;
  }

  getName(): string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  }

  /**
   * Returns if this deck has a commander (0) or the number of commanders it has.
   */
  hasCommander(): number {
    return this.commandZoneGRPIds.length / 2;
  }

  /**
   * Get the commander GrpId
   * @param pos position (default is first)
   */
  getCommanderId(pos = 0): number {
    return this.commandZoneGRPIds[pos * 2];
  }

  /**
   * Return the raw commandZoneGRPIds array for later use.
   */
  getCommanders(): number[] {
    return this.commandZoneGRPIds;
  }

  /**
   * Return the raw commandZoneGRPIds array for later use.
   */
  getCompanion(): number | null {
    return this.companionGRPId;
  }

  /**
   * returns a clone of this deck, not referenced to this instance.
   * */
  clone(): Deck {
    const main = objectClone(this.mainboard.get());
    const side = objectClone(this.sideboard.get());

    const obj = {
      name: this.name,
      id: this.id,
      lastUpdated: this.lastUpdated,
      deckTileId: this.tile,
      commandZoneGRPIds: this.commandZoneGRPIds,
    };

    return new Deck(objectClone(obj), main, side);
  }

  /**
   * Returns a Color class based on the colors of the cards within
   * the mainboard or, if specified, the sideboard.
   * By default it only counts the mainboard.
   * @param countMainboard weter or not to count the mainboard cards.
   * @param countSideboard weter or not to count the sideboard cards.
   */
  getColors(countMainboard = true, countSideboard = false): Colors {
    this._colors = new Colors();

    if (countMainboard) {
      const mainboardColors = this.mainboard.getColors();
      this._colors.addFromColor(mainboardColors);
    }

    if (countSideboard) {
      const sideboardColors = this.sideboard.getColors();
      this._colors.addFromColor(sideboardColors);
    }

    return this._colors;
  }

  /**
   * Returns a txt format string of this deck.
   * */
  getExportTxt(): string {
    let str = "";
    const mainList = this.mainboard.removeDuplicates(false);
    mainList.forEach(function (card) {
      const grpid = card.id;
      const cardName = (database.card(grpid) as DbCardDataV2).Name;

      str += `${card.measurable ? card.quantity : 1} ${cardName}\r\n`;
    });

    str += "\r\n";

    const sideList = this.sideboard.removeDuplicates(false);
    sideList.forEach(function (card) {
      const grpid = card.id;
      const cardName = (database.card(grpid) as DbCardDataV2).Name;

      str += `${card.measurable ? card.quantity : 1} ${cardName}\r\n`;
    });

    return str;
  }

  /**
   * Returns a string to import in MTG Arena
   */
  getExportArena(): string {
    let str = "";
    const listMain = this.mainboard.removeDuplicates(false);
    listMain.forEach(function (card) {
      let grpid = card.id;
      let cardObj = database.card(grpid) as DbCardDataV2;

      if (cardObj.Set == "MED") {
        [grpid] = cardObj.Reprints as number[];
        cardObj = database.card(grpid) as DbCardDataV2;
      }

      let cardName = cardObj.Name;
      if (cardName == "|Ceghm.") cardName = "Swamp";
      // const cardSet = cardObj.set;
      // const cardCn = cardObj.cid;
      const cardQ = card.measurable ? card.quantity : 1;

      // const setCode = db.sets[cardSet].arenacode ?? getSetCode(cardSet);
      str += `${cardQ} ${cardName}\r\n`;
    });

    str += "\r\n";

    const listSide = this.sideboard.removeDuplicates(false);
    listSide.forEach(function (card) {
      let grpid = card.id;
      let cardObj = database.card(grpid) as DbCardDataV2;

      if (cardObj.Set == "MED") {
        [grpid] = cardObj.Reprints as number[];
        cardObj = database.card(grpid) as DbCardDataV2;
      }

      let cardName = cardObj.Name;
      if (cardName == "|Ceghm.") cardName = "Swamp";
      // const cardSet = cardObj.set;
      // const cardCn = cardObj.cid;
      const cardQ = card.measurable ? card.quantity : 1;

      // const setCode = db.sets[cardSet].arenacode || getSetCode(cardSet);
      str += `${cardQ} ${cardName}\r\n`;
    });

    return str;
  }

  /**
   * Returns a copy of this deck as an object.
   */
  getSave(): InternalDeck {
    return objectClone(this.getSaveRaw());
  }

  /**
   * Returns a copy of this deck as an object, but maintains variables references.
   */
  getSaveRaw(): InternalDeck {
    return {
      mainDeck: this.mainboard.get(),
      sideboard: this.sideboard.get(),
      name: this.name,
      id: this.id,
      lastUpdated: this.lastUpdated,
      deckTileId: this.tile,
      colors: this.colors.getBits(),
      commandZoneGRPIds: this.commandZoneGRPIds,
      companionGRPId: this.companionGRPId || undefined,
      format: this.format,
      type: "InternalDeck",
    };
  }

  /**
   * Returns a unique string for this deck. (not hashed)
   * @param checkSide whether or not to use the sideboard (default: true)
   */
  getUniqueString(_checkSide = true): string {
    this.sortMainboard(compareCards);
    // this.sortSideboard(compareCards);

    let str = "";
    this.mainboard.get().forEach((card) => {
      str += `${card.id},${card.quantity},`;
    });

    // if (checkSide) {
    //  this.sideboard.get().forEach((card) => {
    //    str += card.id + "," + card.quantity + ",";
    //  });
    // }

    return str;
  }

  /**
   * Returns this deck's SHA1 hash based on getUniqueString()
   * @param checkSide whether or not to use the sideboard (default: true)
   */
  getHash(checkSide = true): string {
    this.getMainboard().removeDuplicates(true);
    // this.getSideboard().removeDuplicates(true);
    this.getMainboard().removeZeros(true);
    // this.getSideboard().removeZeros(true);
    return sha1(this.getUniqueString(checkSide));
  }
}

export default Deck;
