import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { DbUUIDData } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";

export default async function upsertDbRank(rank: Partial<CombinedRankInfo>) {
  console.log("> Upsert rank", rank);

  const uuid = getLocalSetting("playerId") || "default";
  const { dispatch } = store;

  return window.toolDb
    .getData<DbUUIDData>(`${uuid}-data`, true)
    .then((uuidData) => {
      if (uuidData) {
        const newData = {
          ...uuidData,
          rank: { ...uuidData.rank, ...rank },
          updated: new Date().getTime(),
        };

        reduxAction(dispatch, {
          type: "SET_UUID_DATA",
          arg: newData,
        });

        window.toolDb.putData<DbUUIDData>(`${uuid}-data`, newData, true);
      } else {
        window.toolDb.putData<DbUUIDData>(
          `${uuid}-data`,
          {
            Gems: 0,
            Gold: 0,
            TotalVaultProgress: 0,
            wcTrackPosition: 0,
            WildCardCommons: 0,
            WildCardUnCommons: 0,
            WildCardRares: 0,
            WildCardMythics: 0,
            DraftTokens: 0,
            SealedTokens: 0,
            Boosters: [],
            rank: {
              playerId: uuid,
              constructedSeasonOrdinal: 0,
              constructedClass: "Unranked",
              constructedLevel: 0,
              constructedStep: 0,
              constructedMatchesWon: 0,
              constructedMatchesLost: 0,
              constructedMatchesDrawn: 0,
              limitedSeasonOrdinal: 0,
              limitedClass: "Unranked",
              limitedLevel: 0,
              limitedStep: 0,
              limitedMatchesWon: 0,
              limitedMatchesLost: 0,
              limitedMatchesDrawn: 0,
              constructedPercentile: 0,
              constructedLeaderboardPlace: 0,
              limitedPercentile: 0,
              limitedLeaderboardPlace: 0,
              ...rank,
            },
            updated: new Date().getTime(),
          },
          true
        );
      }
    });
}
