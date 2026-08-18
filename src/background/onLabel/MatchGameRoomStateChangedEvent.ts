/* eslint-disable radix */

import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import readMatchManger from "../../reader/readMatchManger";
import readMatchOpponentInfo from "../../reader/readMatchOpponentInfo";
import readMatchPlayerInfo from "../../reader/readMatchPlayerInfo";
import readRank from "../../reader/readRank";
import { InternalDeck, MatchGameRoomStateChange } from "../../types";
import LogEntry from "../../types/logDecoder";
import convertV4ListToV2 from "../../utils/convertV4ListToV2";
import isElectron from "../../utils/electron/isElectron";
import getLocalSetting from "../../utils/getLocalSetting";
import isLimitedEventId from "../../utils/isLimitedEventId";
import Deck from "../../utils/mtga/deck";
import actionLog from "../actionLog";
import { isLiveLog } from "../logReadState";
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

// Async: the live-match memory reads (mtga-reader 0.1.7) return Promises.
// logEntrySwitch fire-and-forgets this handler; all reads self-catch, so the
// promise never rejects.
export default async function onLabelMatchGameRoomStateChangedEvent(
  entry: Entry
): Promise<void> {
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
    // A course stored at EventJoin time has no deck until one is submitted.
    if (course && course.CourseDeck) {
      // Should make a standard function to conver these new format decks
      const main = convertV4ListToV2(course.CourseDeck.MainDeck);
      const side = convertV4ListToV2(course.CourseDeck.Sideboard);
      const deckId = course.CourseDeckSummary?.DeckId ?? "";

      // The commander, which this path used to drop on the floor.
      //
      // Every other way a deck is selected carries it (convertDeckFromV3 maps
      // commandZoneGRPIds, convertDeckFromV4 reads Deck.CommandZone); this one
      // rebuilt the deck by hand and never copied it across, so a Brawl deck
      // arriving here lost its commander while keeping all 99 other cards. It
      // showed up as ~73% of DirectGameBrawl matches and ~29% of Midweek Magic
      // ones saved with an empty command zone — the games where this fallback
      // wins the race against the real deck-submit line, which for a direct
      // challenge is every game you did not start yourself.
      const zone = (course.CourseDeck.CommandZone || []).map((c) => c.cardId);
      const companion = (course.CourseDeck.Companions || []).map(
        (c) => c.cardId
      )[0];

      // Nothing usable in the course? Keep what the deck already had rather
      // than replacing it with nothing. Guarded on the deck id so a commander
      // can never be carried across to a different deck; when the course has
      // no id at all the previous deck is the only candidate anyway.
      const previous = globalStore.currentMatch.originalDeck;
      const sameDeck = !deckId || !previous.id || previous.id === deckId;
      const carried =
        zone.length === 0 && sameDeck ? previous.getCommanders() : zone;

      const deck: InternalDeck = {
        id: deckId,
        name: course.CourseDeckSummary?.Name || "",
        lastUpdated: "",
        deckTileId: course.CourseDeckSummary?.DeckTileId ?? 0,
        format: "",
        mainDeck: main,
        sideboard: side,
        commandZoneGRPIds: carried,
        companionGRPId: companion ?? previous.getSave().companionGRPId,
        // No colors here: the deck derives them from its own lands.
        type: "InternalDeck",
      };

      // A singleton deck with no commander is a capture failure, not a deck.
      // Say so in the log: the alternative is a match saved as an archetype
      // nobody can name, discovered weeks later in aggregate.
      if (carried.length === 0 && main.length > 50) {
        console.warn(
          `[deck] no commander for a ${main.length}-card deck in ${eventId};` +
            " saving without one"
        );
      }

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

    // Live-match rank/opponent memory reads: skip during catch-up — they read
    // the CURRENT match's memory, irrelevant to a historical game. The reads
    // run async on the native threadpool, so they never block this renderer's
    // event loop (which also hosts the GRE parser).
    if (isElectron() && isLiveLog()) {
      const matchState = await readMatchManger();

      const oppInfo = await readMatchOpponentInfo();
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

      const playerInfo = await readMatchPlayerInfo();

      // This doesnt work on this screen
      const playerRank = await readRank();

      // eslint-disable-next-line no-nested-ternary
      const rankData = playerRank
        ? isLimited
          ? {
              step: playerRank.limitedStep,
              percentile: playerRank.limitedPercentile,
              leaderboardPlace: playerRank.limitedLeaderboardPlace,
              classValue: (playerRank as any).limitedClassValue,
            }
          : {
              step: playerRank.constructedStep,
              percentile: playerRank.constructedPercentile,
              leaderboardPlace: playerRank.constructedLeaderboardPlace,
              classValue: (playerRank as any).constructedClassValue,
            }
        : undefined;

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
          ...rankData,
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
