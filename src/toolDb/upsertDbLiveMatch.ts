import { OverlayUpdateMatchState } from "../background/store/types";
import { putData } from "./worker-wrapper";

export default async function upsertDbLiveMatch(
  match: OverlayUpdateMatchState
) {
  const liveMatchKey = `livematch-${match.matchId}`;

  // Clear some fields to optimize network/bandwidth
  const newLiveMatchData: any = { ...match };
  delete newLiveMatchData.gameObjects;
  delete newLiveMatchData.idChanges;
  delete newLiveMatchData.initialLibraryInstanceIds;
  delete newLiveMatchData.instanceToCardIdMap;
  delete newLiveMatchData.statsHeatMap;
  delete newLiveMatchData.cardsCast;

  putData(liveMatchKey, newLiveMatchData);
}
