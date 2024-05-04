/* eslint-disable radix */
import {
  CardsList,
  convertV4ListToV2,
  Deck,
  InternalDeck,
  MatchGameRoomStateChange,
} from "mtgatool-shared";

import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import readMatchManger from "../../reader/readMatchManger";
import readMatchOpponentInfo from "../../reader/readMatchOpponentInfo";
import readMatchPlayerInfo from "../../reader/readMatchPlayerInfo";
import LogEntry from "../../types/logDecoder";
import getLocalSetting from "../../utils/getLocalSetting";
import isLimitedEventId from "../../utils/isLimitedEventId";
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

const rankClass: Record<number, string> = {
  "-1": "Unranked",
  "0": "Beginner",
  "1": "Bronze",
  "2": "Silver",
  "3": "Gold",
  "4": "Platinum",
  "5": "Diamond",
  "6": "Mythic",
};

export default function onLabelMatchGameRoomStateChangedEvent(
  entry: Entry
): void {
  const { json } = entry;

  const gameRoom = json.matchGameRoomStateChangedEvent.gameRoomInfo;
  let eventId = "";

  if (gameRoom.gameRoomConfig.eventId) {
    eventId = gameRoom.gameRoomConfig.eventId;
    setCurrentMatchMany({
      eventId: eventId,
    });
    // globals.duringMatch = true;
  }

  if ((gameRoom.gameRoomConfig as any).reservedPlayers) {
    eventId = (gameRoom.gameRoomConfig as any).reservedPlayers[0].eventId;
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
    globalStore.currentActionLog.lines = [];
    globalStore.currentActionLog.players = [];
    actionLog({
      seat: -1,
      type: "START",
      timestamp: globalStore.currentMatch.logTime.getTime(),
    });
    resetCurrentMatch();
    const playerId = getLocalSetting("playerId");
    // let oppId = "";

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
        // postChannelMessage({
        //   type: "UPSERT_DB_DECK",
        //   value: deck,
        // });
      }
    }

    gameRoom.gameRoomConfig.reservedPlayers.forEach((player) => {
      globalStore.currentActionLog.players.push({
        name: player.playerName,
        seat: player.systemSeatId,
        userId: player.userId,
      });

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
        // oppId = player.userId;
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

    const isLimited = isLimitedEventId(gameRoom.gameRoomConfig.eventId);

    const matchState = readMatchManger();

    const oppInfo = readMatchOpponentInfo();
    if (
      oppInfo &&
      matchState &&
      matchState["<MatchID>k__BackingField"] ===
        gameRoom.gameRoomConfig.matchId &&
      oppInfo.RankingClass > 0
    ) {
      const opponent = {
        tier: oppInfo.RankingTier,
        rank: rankClass[oppInfo.RankingClass],
        percentile: oppInfo.MythicPercentile,
        leaderboardPlace: oppInfo.MythicPlacement,
      };
      setOpponent(opponent);
    }

    const playerInfo = readMatchPlayerInfo();
    if (
      playerInfo &&
      matchState &&
      matchState["<MatchID>k__BackingField"] ===
        gameRoom.gameRoomConfig.matchId &&
      playerInfo.RankingClass > 0
    ) {
      const player = {
        tier: playerInfo.RankingTier,
        rank: rankClass[playerInfo.RankingClass],
        percentile: playerInfo.MythicPercentile,
        leaderboardPlace: playerInfo.MythicPlacement,
      };
      setPlayer(player);

      if (isLimited) {
        postChannelMessage({
          type: "UPSERT_DB_RANK",
          value: {
            limitedClass: rankClass[playerInfo.RankingClass],
            limitedLevel: playerInfo.RankingTier,
          },
        });
      } else {
        postChannelMessage({
          type: "UPSERT_DB_RANK",
          value: {
            constructedClass: rankClass[playerInfo.RankingClass],
            constructedLevel: playerInfo.RankingTier,
          },
        });
      }
    }

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

    postChannelMessage({
      type: "UPSERT_DB_RANK",
      value: toAdd,
    });

    gameRoom.finalMatchResult.resultList.forEach((res) => {
      if (res.scope == "MatchScope_Match") {
        // globals.duringMatch = false;
      }
    });

    saveMatch(`${gameRoom.finalMatchResult.matchId}`);
  }
}
