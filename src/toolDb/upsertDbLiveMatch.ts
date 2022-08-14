import { OverlayUpdateMatchState } from "../background/store/types";

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

  window.toolDb.putData(liveMatchKey, newLiveMatchData);
}
