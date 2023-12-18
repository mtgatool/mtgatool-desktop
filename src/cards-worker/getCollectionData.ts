import { CardsData } from "../types/collectionTypes";
import allFormats from "./allFormats";
import Colors from "./colors";
import getCardBanned from "./getCardBanned";
import getCardFormats from "./getCardFormats";
import getCardInBoosters from "./getCardInBoosters";
import getCardIsCraftable from "./getCardIsCraftable";
import getCardSuspended from "./getCardSuspended";
import getRarityFilterVal from "./getRarityFilterVal";
import CardType from "./typesWrap";

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

const FACE_SPECIALIZE_BACK = 11;
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
  cards: {
    prevCards: Record<string, number>;
    cards: Record<string, number>;
  },
  cardsList: CardType[],
  allCards: Record<string, CardType>,
  setNames: any,
  sets: any
): any[] {
  return cardsList
    .filter(
      (card) =>
        card.LinkedFaceType !== FACE_DFC_BACK &&
        card.LinkedFaceType !== 3 && // meld
        card.LinkedFaceType !== FACE_ADVENTURE &&
        card.LinkedFaceType !== FACE_SPLIT &&
        card.LinkedFaceType !== FACE_MODAL_BACK &&
        card.LinkedFaceType !== FACE_SPECIALIZE_BACK
    )
    .map((card) => {
      const RANK_SOURCE =
        card.RankData.rankSource == 0 ? DRAFT_RANKS : DRAFT_RANKS_LOLA;

      const dfc =
        allCards[
          card.LinkedFaceGrpIds.length > 0 ? card.LinkedFaceGrpIds[0] : 0
        ];
      const dfcName = dfc?.Name.toLowerCase() || "";
      const fullName = `${card.Name.toLowerCase()} ${dfcName}`;
      const fullType = [
        card.Supertypes.toLowerCase(),
        card.Types.toLowerCase(),
        card.Subtypes.toLowerCase(),
      ].join(" ");
      const artist = card.ArtistCredit?.toLowerCase() || "";

      const owned = cards.cards[card.GrpId] ?? 0;
      const acquired =
        (cards.cards[card.GrpId] || 0) - (cards.prevCards[card.GrpId] || 0);

      const colorsObj = new Colors();
      colorsObj.addFromCost(card.ManaCost);
      const colorSortVal = colorsObj.get().join("");
      let colors = colorsObj.getBits();
      if (colors > 31 && colors !== 32) {
        colors -= 32;
      }
      const rarityVal = getRarityFilterVal(card.Rarity);
      const rankSortVal =
        RANK_SOURCE[card.RankData.rankSource !== -1 ? card.RankData.rank : 0] ??
        "?";

      const setCode = [
        card.DigitalSet?.toLowerCase() || card.Set.toLowerCase(),
      ];

      const format = getCardFormats(card, allCards, setNames, sets);
      const banned = getCardBanned(card);
      const suspended = getCardSuspended(card);
      const craftable = getCardIsCraftable(card, allCards, setNames, sets);
      const booster = getCardInBoosters(card, setNames, sets);
      const finalCard: CardsData = {
        // : CardsData
        id: card.GrpId,
        cmc: card.Cmc,
        cid: parseFloat(card.CollectorNumber),
        fullName,
        fullType,
        artist,
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

      return finalCard;
    });
}
