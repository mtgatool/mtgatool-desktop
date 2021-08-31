import _ from "lodash";
import { Deck, InternalMatch } from "mtgatool-shared";
import { DbDeck, DbMatch } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";
import objToBase from "../utils/objToBase";

export default async function setDbMatch(match: InternalMatch) {
  console.log("> Set match", match);

  const newDbMatch: DbMatch = {
    matchId: match.id,
    playerId: getLocalSetting("playerId"),
    playerDeckId: match.playerDeck.id,
    playerDeckHash: match.playerDeckHash,
    playerDeckColors: new Deck(match.playerDeck).colors.getBits(),
    oppDeckColors: new Deck(match.oppDeck).colors.getBits(),
    playerName: match.player.name,
    playerWins: match.player.wins,
    playerLosses: match.opponent.wins,
    eventId: match.eventId,
    duration: match.duration,
    internalMatch: objToBase(match),
    timestamp: new Date().getTime(),
    actionLog: match.actionLog,
  };

  const hasWon = match.player.wins > match.opponent.wins;

  window.toolDb.putData<DbMatch>(`matches-${match.id}`, newDbMatch, true);
  window.toolDb
    .getData<string[]>("matchesIndex", true)
    .then((oldMatchesIndex) =>
      window.toolDb.putData<string[]>(
        "matchesIndex",
        _.uniq([...oldMatchesIndex, match.id]),
        true
      )
    );

  window.toolDb
    .getData<Record<string, number>>("decksIndex", true)
    .then((oldDecksIndex) => {
      const deckId = `${match.playerDeck.id}-v${
        oldDecksIndex[match.playerDeck.id]
      }`;

      window.toolDb.getData<DbDeck>(`decks-${deckId}`, true).then((deck) => {
        const newDeck: DbDeck = { ...deck };
        if (!Object.keys(newDeck.matches).includes(match.id)) {
          newDeck.stats.gameWins += match.player.wins;
          newDeck.stats.gameLosses += match.opponent.wins;
          newDeck.stats.matchWins += hasWon ? 1 : 0;
          newDeck.stats.matchLosses += hasWon ? 0 : 1;
          console.log("Deck's match new stats: ", newDeck.stats);

          window.toolDb.putData<DbDeck>(`decks-${deckId}`, newDeck, true);
        }
      });
    });
}
