import { MatchGameRoomStateChange } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";
import getLocalSetting from "../../utils/getLocalSetting";
import saveMatch from "../saveMatch";
import globalStore from "../store";
import {
  setCurrentMatchMany,
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
    gameRoom.gameRoomConfig.reservedPlayers.forEach((player) => {
      if (player.userId == getLocalSetting("playerId")) {
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
        setOpponent({
          name: player.playerName,
          userid: player.userId,
        });
        setCurrentMatchMany({
          oppSeat: player.systemSeatId,
        });
      }
    });
  }
  // When the match ends (but not the last message)
  if (gameRoom.stateType == "MatchGameRoomStateType_MatchCompleted") {
    const { currentMatch } = globalStore;
    // const format =
    //   currentMatch.gameInfo.superFormat == "SuperFormat_Constructed"
    //     ? "constructed"
    //     : "limited";

    const player = {
      seat: currentMatch.playerSeat,
    };
    setPlayer(player);

    const opponent = {
      seat: currentMatch.oppSeat,
    };
    setOpponent(opponent);

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
