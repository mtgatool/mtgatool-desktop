"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertDbMatchToData = void 0;
const getRankFilterVal_1 = __importDefault(require("./getRankFilterVal"));
function convertDbMatchToData(match) {
    const { internalMatch } = match;
    return {
        uuid: match.playerId,
        matchId: match.matchId,
        internalMatch: match.internalMatch,
        playerDeckName: internalMatch.player.name,
        timestamp: match.timestamp,
        duration: match.duration,
        win: match.playerWins > match.playerLosses,
        eventId: match.eventId,
        playerDeckColors: match.playerDeckColors,
        oppDeckColors: match.oppDeckColors,
        playerWins: match.playerWins,
        playerLosses: match.playerLosses,
        rank: (0, getRankFilterVal_1.default)(internalMatch.player.rank),
    };
}
exports.convertDbMatchToData = convertDbMatchToData;
function getLocalData(key) {
    return new Promise((resolve, reject) => {
        self.toolDb.store.get(key, (err, data) => {
            if (err) {
                reject(err);
            }
            else if (data) {
                try {
                    const json = JSON.parse(data);
                    resolve(json.v);
                }
                catch (e) {
                    reject(e);
                }
            }
            else {
                reject(new Error("No data"));
            }
        });
    });
}
function getMatchesData(matchesIds, uuid) {
    console.log("getMatchesData", matchesIds, uuid);
    const promises = matchesIds.map((id) => {
        console.log(id);
        return getLocalData(id);
    });
    Promise.all(promises)
        .then((matches) => matches.filter((m) => m).map((m) => convertDbMatchToData(m)))
        .then((data) => {
        console.log("getMatchesData data out", data.length, "matches");
        self.postMessage({
            type: "MATCHES_DATA",
            value: data.filter((m) => m.uuid === uuid),
        });
    });
}
exports.default = getMatchesData;
