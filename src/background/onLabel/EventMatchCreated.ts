/* eslint-disable @typescript-eslint/no-var-requires */
import LogEntry from "../../types/logDecoder";
import actionLog from "../actionLog";
import globalStore from "../store";
import {
  resetCurrentMatch,
  setEventId,
  setOpponent,
  setPlayer,
} from "../store/currentMatchStore";

interface EntryJson {
  controllerFabricUri: string;
  matchEndpointHost: string;
  matchEndpointPort: number;
  opponentScreenName: string;
  opponentIsWotc: boolean;
  matchId: string;
  opponentRankingClass: string;
  opponentRankingTier: number;
  opponentMythicPercentile: number;
  opponentMythicLeaderboardPlace: number;
  eventId: string;
  opponentAvatarSelection: string;
  opponentCardBackSelection: string;
  opponentPetSelection: { name: string; variant: string };
  avatarSelection: string;
  cardbackSelection: string;
  petSelection: { name: string; variant: string };
  battlefield: string;
  opponentCommanderGrpIds: number[];
  commanderGrpIds: number[];
}

interface Entry extends LogEntry {
  json: EntryJson;
}

export default function EventMatchCreated(entry: Entry): void {
  const { json } = entry;

  if (json.eventId != "NPE") {
    actionLog(-99, globalStore.currentMatch.logTime, "");
    resetCurrentMatch();

    console.log(`vs ${json.opponentScreenName}`);

    const opponent = {
      tier: json.opponentRankingTier,
      name: `${json.opponentScreenName}#00000`,
      rank: json.opponentRankingClass,
      percentile: json.opponentMythicPercentile,
      leaderboardPlace: json.opponentMythicLeaderboardPlace,
      commanderGrpIds: json.opponentCommanderGrpIds,
    };
    setOpponent(opponent);

    const player = {
      commanderGrpIds: json.commanderGrpIds,
    };
    setPlayer(player);
    setEventId(json.eventId);
  }
}
