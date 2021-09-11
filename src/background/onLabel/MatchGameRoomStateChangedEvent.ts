/* eslint-disable radix */
import {
  CardsList,
  convertV4ListToV2,
  Deck,
  InternalDeck,
  MatchGameRoomStateChange,
} from "mtgatool-shared";
import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import upsertDbRank from "../../toolDb/upsertDbRank";
import LogEntry from "../../types/logDecoder";
import getLocalSetting from "../../utils/getLocalSetting";
import actionLog from "../actionLog";
import saveMatch from "../saveMatch";
import selectDeck from "../selectDeck";
import globalStore from "../store";
import {
  resetCurrentMatch,
  setCurrentMatchMany,
  setEventId,
  setOpponent,
  setPlayer,
} from "../store/currentMatchStore";
import { CombinedRankInfo } from "./InEventGetCombinedRankInfo";

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

  // Now only when a match begins
  if (gameRoom.stateType == "MatchGameRoomStateType_Playing") {
    actionLog(-99, globalStore.currentMatch.logTime, "");
    resetCurrentMatch();
    const playerId = getLocalSetting("playerId");
    let oppId = "";

    const course = globalStore.currentCourses[eventId];
    if (course) {
      // Should make a standard function to conver these new format decks
      const main = convertV4ListToV2(course.CourseDeck.MainDeck);
      const side = convertV4ListToV2(course.CourseDeck.Sideboard);
      const deck: InternalDeck = {
        id: course.CourseDeckSummary.DeckId,
        name: course.CourseDeckSummary.Name || "",
        lastUpdated: "",
        deckTileId: course.CourseDeckSummary.DeckTileId,
        format: "",
        mainDeck: main,
        sideboard: side,
        colors: new CardsList(main).getColors().getBits(),
        type: "InternalDeck",
      };
      if (deck) {
        selectDeck(new Deck(deck));
        postChannelMessage({
          type: "UPSERT_DB_DECK",
          value: deck,
        });
      }
    }

    gameRoom.gameRoomConfig.reservedPlayers.forEach((player) => {
      if (player.userId == playerId) {
        setPlayer({
          seat: player.systemSeatId,
          name: player.playerName,
          userid: player.userId,
        });
        setCurrentMatchMany({
          playerSeat: player.systemSeatId,
        });
      } else {
        console.log(`vs ${player.playerName}`);
        oppId = player.userId;
        setOpponent({
          seat: player.systemSeatId,
          name: player.playerName,
          userid: player.userId,
        });
        setCurrentMatchMany({
          oppSeat: player.systemSeatId,
        });
      }
    });

    const metadata = (gameRoom.gameRoomConfig as any).clientMetadata;

    const opponent = {
      tier: parseInt(metadata[`${oppId}_RankTier`]),
      rank: metadata[`${oppId}_RankClass`],
      percentile: parseInt(metadata[`${oppId}_LeaderboardPercentile`]),
      leaderboardPlace: parseInt(metadata[`${oppId}_LeaderboardPlacement`]),
      // commanderGrpIds: json.opponentCommanderGrpIds,
    };
    setOpponent(opponent);

    const player = {
      tier: parseInt(metadata[`${playerId}_RankTier`]),
      rank: metadata[`${playerId}_RankClass`],
      percentile: parseInt(metadata[`${playerId}_LeaderboardPercentile`]),
      leaderboardPlace: parseInt(metadata[`${playerId}_LeaderboardPlacement`]),
    };
    setPlayer(player);

    setEventId(eventId);

    postChannelMessage({
      type: "GAME_START",
    });
  }
  // When the match ends (but not the last message)
  if (gameRoom.stateType == "MatchGameRoomStateType_MatchCompleted") {
    const { currentMatch } = globalStore;
    // const playerRank = globalStore.rank;
    const format =
      currentMatch.gameInfo.superFormat == "SuperFormat_Constructed"
        ? "constructed"
        : "limited";

    const toAdd: Partial<CombinedRankInfo> = {};

    if (format == "limited") {
      toAdd.limitedClass = currentMatch.player.rank;
    } else {
      toAdd.constructedClass = currentMatch.player.rank;
    }
    upsertDbRank(toAdd);

    gameRoom.finalMatchResult.resultList.forEach((res) => {
      if (res.scope == "MatchScope_Match") {
        // globals.duringMatch = false;
      }
    });

    saveMatch(`${gameRoom.finalMatchResult.matchId}`);
  }
}
