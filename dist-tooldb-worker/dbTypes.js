"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultCardsData = exports.defaultRankData = exports.defaultInventoryData = void 0;
exports.defaultInventoryData = {
    Gems: 0,
    Gold: 0,
    TotalVaultProgress: 0,
    wcTrackPosition: 0,
    WildCardCommons: 0,
    WildCardUnCommons: 0,
    WildCardRares: 0,
    WildCardMythics: 0,
    DraftTokens: 0,
    SealedTokens: 0,
    Boosters: [],
};
exports.defaultRankData = {
    playerId: "",
    constructedSeasonOrdinal: 0,
    constructedClass: "Unranked",
    constructedLevel: 0,
    constructedStep: 0,
    constructedMatchesWon: 0,
    constructedMatchesLost: 0,
    constructedMatchesDrawn: 0,
    limitedSeasonOrdinal: 0,
    limitedClass: "Unranked",
    limitedLevel: 0,
    limitedStep: 0,
    limitedMatchesWon: 0,
    limitedMatchesLost: 0,
    limitedMatchesDrawn: 0,
    constructedPercentile: 0,
    constructedLeaderboardPlace: 0,
    limitedPercentile: 0,
    limitedLeaderboardPlace: 0,
};
exports.defaultCardsData = {
    cards: {},
    prevCards: {},
    updated: new Date().getTime(),
};
