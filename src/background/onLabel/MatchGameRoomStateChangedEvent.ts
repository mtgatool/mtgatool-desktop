import { MatchGameRoomStateChange } from "mtgatool-shared";
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import getLocalSetting from "../../utils/getLocalSetting";
import actionLog from "../actionLog";
import saveMatch from "../saveMatch";
import globalStore from "../store";
import {
  resetCurrentMatch,
  setCurrentMatchMany,
  setEventId,
  setOpponent,
  setPlayer,
} from "../store/currentMatchStore";

interface Entry extends LogEntry {
  json: MatchGameRoomStateChange;
}

export default function onLabelMatchGameRoomStateChangedEvent(
  entry: Entry
): void {
  const { json } = entry;

  const gameRoom = json.matchGameRoomStateChangedEvent.gameRoomInfo;
  let eventId = "";

  if (gameRoom.gameRoomConfig) {
    eventId = gameRoom.gameRoomConfig.eventId;
    setCurrentMatchMany({
      eventId: eventId,
    });
    // globals.duringMatch = true;
  }

  if (eventId == "NPE") return;

  // Now only when a match begins
  if (gameRoom.stateType == "MatchGameRoomStateType_Playing") {
    let oppId = "";
    gameRoom.gameRoomConfig.reservedPlayers.forEach((player) => {
      const { currentMatch } = globalStore;
      if (player.userId == getLocalSetting("playerId")) {
        currentMatch.player.name = player.playerName;
        setPlayer({
          name: player.playerName,
          userid: player.userId,
        });
        setCurrentMatchMany({
          name: player.playerName,
          playerSeat: player.systemSeatId,
          userid: player.userId,
        });
      } else {
        currentMatch.opponent.name = player.playerName;

        console.log(`vs ${player.playerName}`);
        oppId = player.userId;
        setOpponent({
          name: player.playerName,
          userid: player.userId,
        });
        setCurrentMatchMany({
          oppSeat: player.systemSeatId,
        });
      }
    });

    actionLog(-99, globalStore.currentMatch.logTime, "");
    resetCurrentMatch();

    const metadata = (gameRoom.gameRoomConfig as any).clientMetadata;

    const opponent = {
      tier: metadata[`${oppId}_RankTier`],
      rank: metadata[`${oppId}_RankClass`],
      percentile: metadata[`${oppId}_LeaderboardPercentile`],
      leaderboardPlace: metadata[`${oppId}_LeaderboardPlacement`],
      // commanderGrpIds: json.opponentCommanderGrpIds,
    };
    setOpponent(opponent);

    // const player = {
    //   commanderGrpIds: json.commanderGrpIds,
    // };
    // setPlayer(player);
    setEventId(eventId);

    postChannelMessage({
      type: "GAME_START",
    });
  }
  // When the match ends (but not the last message)
  if (gameRoom.stateType == "MatchGameRoomStateType_MatchCompleted") {
    const { currentMatch } = globalStore;
    const playerRank = globalStore.rank;
    const format =
      currentMatch.gameInfo.superFormat == "SuperFormat_Constructed"
        ? "constructed"
        : "limited";

    const player = {
      seat: currentMatch.playerSeat,
      tier: playerRank[format].tier,
      rank: playerRank[format].rank,
      percentile: playerRank[format].percentile,
      leaderboardPlace: playerRank[format].leaderboardPlace,
    };
    setPlayer(player);

    gameRoom.finalMatchResult.resultList.forEach((res) => {
      if (res.scope == "MatchScope_Match") {
        // globals.duringMatch = false;
      }
    });

    // clearDeck();
    // globals.matchCompletedOnGameNumber = gameRoom.finalMatchResult.resultList.length - 1;
    saveMatch(`${gameRoom.finalMatchResult.matchId}`);
  }
  // Only update if needed
  if (json.players) {
    json.players.forEach((player) => {
      const { currentMatch } = globalStore;
      if (
        player.userId == getLocalSetting("playerId") &&
        currentMatch.playerSeat !== player.systemSeatId
      ) {
        setCurrentMatchMany({
          playerSeat: player.systemSeatId,
        });
      } else if (currentMatch.oppSeat !== player.systemSeatId) {
        setCurrentMatchMany({
          oppSeat: player.systemSeatId,
        });
      }
    });
  }
}
