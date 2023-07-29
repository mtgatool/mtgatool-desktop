"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = __importDefault(require("./colors"));
const getCardBanned_1 = __importDefault(require("./getCardBanned"));
const getCardFormats_1 = __importDefault(require("./getCardFormats"));
const getCardInBoosters_1 = __importDefault(require("./getCardInBoosters"));
const getCardIsCraftable_1 = __importDefault(require("./getCardIsCraftable"));
const getCardSuspended_1 = __importDefault(require("./getCardSuspended"));
const getRarityFilterVal_1 = __importDefault(require("./getRarityFilterVal"));
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
function getCollectionData(cards, cardsList, allCards, setNames, sets) {
    return cardsList
        .filter((card) => card.LinkedFaceType !== FACE_DFC_BACK &&
        card.LinkedFaceType !== 3 && // meld
        card.LinkedFaceType !== FACE_ADVENTURE &&
        card.LinkedFaceType !== FACE_SPLIT &&
        card.LinkedFaceType !== FACE_MODAL_BACK &&
        card.LinkedFaceType !== FACE_SPECIALIZE_BACK)
        .map((card) => {
        var _a, _b, _c, _d;
        const RANK_SOURCE = card.RankData.rankSource == 0 ? DRAFT_RANKS : DRAFT_RANKS_LOLA;
        const dfc = allCards[card.LinkedFaceGrpIds.length > 0 ? card.LinkedFaceGrpIds[0] : 0];
        const dfcName = (dfc === null || dfc === void 0 ? void 0 : dfc.Name.toLowerCase()) || "";
        const fullName = `${card.Name.toLowerCase()} ${dfcName}`;
        const fullType = [
            card.Supertypes.toLowerCase(),
            card.Types.toLowerCase(),
            card.Subtypes.toLowerCase(),
        ].join(" ");
        const artist = ((_a = card.ArtistCredit) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "";
        const owned = (_b = cards.cards[card.GrpId]) !== null && _b !== void 0 ? _b : 0;
        const acquired = (cards.cards[card.GrpId] || 0) - (cards.prevCards[card.GrpId] || 0);
        const colorsObj = new colors_1.default();
        colorsObj.addFromCost(card.ManaCost);
        const colorSortVal = colorsObj.get().join("");
        let colors = colorsObj.getBits();
        if (colors > 31 && colors !== 32) {
            colors -= 32;
        }
        const rarityVal = (0, getRarityFilterVal_1.default)(card.Rarity);
        const rankSortVal = (_c = RANK_SOURCE[card.RankData.rankSource !== -1 ? card.RankData.rank : 0]) !== null && _c !== void 0 ? _c : "?";
        const setCode = [
            ((_d = card.DigitalSet) === null || _d === void 0 ? void 0 : _d.toLowerCase()) || card.Set.toLowerCase(),
        ];
        const format = (0, getCardFormats_1.default)(card, allCards, setNames, sets);
        const banned = (0, getCardBanned_1.default)(card);
        const suspended = (0, getCardSuspended_1.default)(card);
        const craftable = (0, getCardIsCraftable_1.default)(card, allCards, setNames, sets);
        const booster = (0, getCardInBoosters_1.default)(card, setNames, sets);
        const finalCard = {
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
exports.default = getCollectionData;
