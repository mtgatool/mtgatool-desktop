import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { DbUUIDData, defaultUUIDData } from "../types/dbTypes";
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
          arg: { data: newData, uuid },
        });

        window.toolDb.putData<DbUUIDData>(`${uuid}-data`, newData, true);
      } else {
        window.toolDb.putData<DbUUIDData>(
          `${uuid}-data`,
          {
            ...defaultUUIDData,
            updated: new Date().getTime(),
          },
          true
        );
      }
    });
}
