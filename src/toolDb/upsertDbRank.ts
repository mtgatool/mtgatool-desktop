import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { DbRankData, defaultRankData } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";
import getLocalDbValue from "./getLocalDbValue";

export default async function upsertDbRank(rank: Partial<CombinedRankInfo>) {
  console.log("> Upsert rank", rank);

  const uuid = getLocalSetting("playerId") || "default";
  const { dispatch } = store;

  getLocalDbValue(window.toolDb.getUserNamespacedKey(`${uuid}-rank`)).then(
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
        window.toolDb.putData(`rank-${window.toolDb.getPubKey()}`, {
          ...newData,
          uuid,
          pubKey: window.toolDb.getPubKey(),
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
        window.toolDb.putData(`rank-${window.toolDb.getPubKey()}`, {
          ...defaultRankData,
          updated: new Date().getTime(),
          uuid,
          pubKey: window.toolDb.getPubKey(),
        });
      }
    }
  );
}
