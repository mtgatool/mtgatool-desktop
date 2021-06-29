import electron from "electron";
import {
  getJumpstartThemes,
  InternalMatch,
  JumpstartThemes,
  themeCards,
  constants,
} from "mtgatool-shared";

import { ResultSpec } from "mtgatool-shared/dist/types/greTypes";
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import getToolVersion from "../utils/getToolVersion";
import getOpponentDeck from "./getOpponentDeck";
import globalStore from "./store";
import { setMatchStarted } from "./store/currentMatchStore";

const { DEFAULT_TILE } = constants;

function matchResults(results: ResultSpec[]): number[] {
  let playerWins = 0;
  let opponentWins = 0;
  let draws = 0;
  const { currentMatch } = globalStore;
  results.forEach((res) => {
    if (res.scope == "MatchScope_Game") {
      if (res.result == "ResultType_Draw") {
        draws += 1;
      } else if (res.winningTeamId == currentMatch.playerSeat) {
        playerWins += 1;
      }
      if (res.winningTeamId == currentMatch.oppSeat) {
        opponentWins += 1;
      }
    }
  });

  return [playerWins, opponentWins, draws];
}

// Calculates derived data for storage.
// This is called when a match is complete, before saving.
function generateInternalMatch(): InternalMatch {
  const { currentMatch } = globalStore;

  let bestOf = 1;
  if (currentMatch.gameInfo.matchWinCondition == "MatchWinCondition_Best2of3")
    bestOf = 3;
  if (currentMatch.gameInfo.matchWinCondition == "MatchWinCondition_Best3of5")
    bestOf = 5;
  const duration = currentMatch.matchGameStats.reduce(
    (acc, cur) => acc + cur.time,
    0
  );

  const matchTags: string[] = [];
  const playerDeck = globalStore.currentMatch.originalDeck.getSave();
  const oppDeck = getOpponentDeck();

  if (oppDeck.archetype && oppDeck.archetype !== "Unknown") {
    matchTags.push(oppDeck.archetype);
  }

  const [playerWins, opponentWins, draws] = matchResults(
    currentMatch.gameInfo.results
  );

  /*
    postStats: {
      statsHeatMap: currentMatch.statsHeatMap,
      totalTurns: currentMatch.totalTurns,
      playerStats: currentMatch.playerStats,
      oppStats: currentMatch.oppStats,
    },
  */

  const newMatch: InternalMatch = {
    onThePlay: currentMatch.onThePlay,
    id: currentMatch.matchId,
    date: new Date().toISOString(),
    eventId: currentMatch.eventId,
    player: { ...currentMatch.player, wins: playerWins },
    opponent: { ...currentMatch.opponent, wins: opponentWins },
    oppDeck,
    playerDeck,
    draws,
    bestOf,
    duration,
    gameStats: currentMatch.matchGameStats,
    toolVersion: getToolVersion(),
    toolRunFromSource: !electron.remote.app.isPackaged,
    arenaId: currentMatch.player.name,
    playerDeckHash: globalStore.currentMatch.originalDeck.getHash(),
    actionLog: globalStore.currentActionLog,
    type: "match",
  };

  if (currentMatch.eventId.indexOf("Jumpstart") !== -1) {
    const themes = getJumpstartThemes(globalStore.currentMatch.originalDeck);
    // newMatch.jumpstartTheme = themes.join(" ");
    newMatch.playerDeck.name = themes.join(" ");
    const themeTile = themeCards[themes[0] as JumpstartThemes];
    newMatch.playerDeck.deckTileId = themeTile || DEFAULT_TILE;
  }

  newMatch.oppDeck.commandZoneGRPIds = currentMatch.opponent.commanderGrpIds;
  newMatch.oppDeck.companionGRPId = currentMatch.opponent.companionGrpId;

  return newMatch;
}

export default function saveMatch(id: string): void {
  const { currentMatch } = globalStore;
  console.log(id, currentMatch);

  const match = generateInternalMatch();

  console.log(`Save match: `, match);

  // const gameNumberCompleted = currentMatch.gameInfo.results.filter(
  //   (res) => res.scope == "MatchScope_Game"
  // ).length;
  setMatchStarted(false);
  postChannelMessage({
    type: "GAME_STATS",
    value: match,
  });
}
