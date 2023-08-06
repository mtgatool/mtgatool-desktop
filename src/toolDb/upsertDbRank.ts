import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import {
  DbRankData,
  DbRankDataWithKey,
  defaultRankData,
} from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";
import { getLocalData } from "./worker-wrapper";

export default async function upsertDbRank(rank: Partial<CombinedRankInfo>) {
  console.log("> Upsert rank", rank);

  const uuid = getLocalSetting("playerId") || "default";
  const { dispatch } = store;

  const pubKey = getLocalSetting("pubkey");

  getLocalData(window.toolDb.getUserNamespacedKey(`${uuid}-rank`)).then(
    (uuidData) => {
      if (uuidData) {
        const newData: DbRankData = {
          ...(uuidData as DbRankData),
          ...rank,
          updated: new Date().getTime(),
        };

        reduxAction(dispatch, {
          type: "SET_UUID_RANK_DATA",
          arg: { rank: newData, uuid },
        });

        window.toolDb.putData<DbRankData>(`${uuid}-rank`, newData, true);
        window.toolDb.putData<DbRankDataWithKey>(`rank-${pubKey}`, {
          ...newData,
          uuid,
          pubKey: pubKey,
        });
      } else {
        window.toolDb.putData<DbRankData>(
          `${uuid}-rank`,
          {
            ...defaultRankData,
            updated: new Date().getTime(),
          },
          true
        );
        window.toolDb.putData<DbRankDataWithKey>(`rank-${pubKey}`, {
          ...defaultRankData,
          updated: new Date().getTime(),
          uuid,
          pubKey: pubKey,
        });
      }
    }
  );
}
