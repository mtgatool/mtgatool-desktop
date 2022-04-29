import Colors from "./colors";
import getCardBanned from "./getCardBanned";
import getCardFormats from "./getCardFormats";
import getCardInBoosters from "./getCardInBoosters";
import getCardIsCraftable from "./getCardIsCraftable";
import getCardSuspended from "./getCardSuspended";
import getRarityFilterVal from "./getRarityFilterVal";

const DRAFT_RANKS = [
  "F",
  "D-",
  "D",
  "D+",
  "C-",
  "C",
  "C+",
  "B-",
  "B",
  "B+",
  "A-",
  "A",
  "A+",
];
const DRAFT_RANKS_LOLA = [
  "",
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
];

const FACE_ADVENTURE = 7;
const FACE_MODAL_BACK = 9;
const FACE_DFC_BACK = 1;
const FACE_SPLIT = 5;

/**
 * Creates a representation of the database so its easier to filter and search trough it
 * @param cards Owned Cards
 * @param cardsNew New Cards added to collection
 * @returns Cards Data
 */
export default function getCollectionData(
  cards: any,
  cardsList: any[],
  allCards: Record<string, any>,
  setNames: any,
  sets: any
): any[] {
  return cardsList
    .filter(
      (card) =>
        card.dfc !== FACE_DFC_BACK &&
        card.dfc !== FACE_ADVENTURE &&
        card.dfc !== FACE_SPLIT &&
        card.dfc !== FACE_MODAL_BACK
    )
    .map((card): any => {
      const RANK_SOURCE = card.source == 0 ? DRAFT_RANKS : DRAFT_RANKS_LOLA;

      const dfc = allCards[card.dfcId !== true ? card.dfcId || 0 : 0];
      const dfcName = dfc?.name.toLowerCase() || "";
      const name = `${card.name.toLowerCase()} ${dfcName}`;
      const type = card.type.toLowerCase();
      const artist = card.artist?.toLowerCase() || "";

      const owned = cards.cards[card.id] ?? 0;
      const acquired =
        (cards.cards[card.id] || 0) - (cards.prevCards[card.id] || 0);

      const colorsObj = new Colors();
      colorsObj.addFromCost(card.cost);
      const colorSortVal = colorsObj.get().join("");
      let colors = colorsObj.getBits();
      if (colors > 31 && colors !== 32) {
        colors -= 32;
      }
      const rarityVal = getRarityFilterVal(card.rarity);
      const rankSortVal = RANK_SOURCE[card.rank] ?? "?";

      const setCode =
        card.set_digital === ""
          ? [card.set.toLowerCase()]
          : [card.set_digital.toLowerCase()];

      const { set } = card;

      const format = getCardFormats(card, allCards, setNames, sets);
      const banned = getCardBanned(card);
      const suspended = getCardSuspended(card);
      const craftable = getCardIsCraftable(card, allCards, setNames, sets);
      const booster = getCardInBoosters(card, setNames, sets);
      return {
        ...card,
        name,
        type,
        artist,
        set,
        owned,
        acquired,
        colors,
        colorSortVal,
        rankSortVal,
        rarityVal,
        setCode,
        format,
        banned,
        suspended,
        legal: format,
        craftable,
        booster,
      };
    });
}
