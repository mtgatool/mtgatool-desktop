/* eslint-disable @typescript-eslint/no-var-requires */
import LogEntry from "../../types/logDecoder";

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
  const _json = entry.json;
}
