import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import { DbUUIDData } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";

export default async function upsertDbRank(rank: Partial<CombinedRankInfo>) {
  console.log("> Upsert rank", rank);

  const uuid = getLocalSetting("playerId") || "default";

  return window.toolDb
    .getData<DbUUIDData>(`${uuid}.data`, true)
    .then((uuidData) => {
      if (uuidData) {
        const newData = {
          ...uuidData,
          rank: { ...uuidData.rank, ...uuidData },
          updated: new Date().getTime(),
        };

        window.toolDb.putData<DbUUIDData>(`${uuid}.data`, newData, true);
      }
    });
}
