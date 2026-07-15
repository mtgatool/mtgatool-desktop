import _ from "lodash";

import { CombinedRankInfo } from "../background/onLabel/InEventGetCombinedRankInfo";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { DbRankData, defaultRankData } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";
import { isValidRankClass } from "../utils/mtga/rankClasses";
import { pushRanks } from "./cloudSync";
import { getData, putData } from "./store";

export default async function upsertDbRank(arg: Partial<CombinedRankInfo>) {
  const rank = _(arg).omitBy(_.isUndefined).omitBy(_.isNull).value() as Partial<
    CombinedRankInfo
  >;

  // Never persist a bogus class (e.g. "Spark" from an unreadable process): drop
  // the offending queue's fields so it can't clobber — or get pushed over — a
  // real rank. A legit read always has a valid class.
  if (rank.constructedClass && !isValidRankClass(rank.constructedClass)) {
    delete rank.constructedClass;
    delete rank.constructedLevel;
    delete rank.constructedStep;
    delete rank.constructedPercentile;
    delete rank.constructedLeaderboardPlace;
  }
  if (rank.limitedClass && !isValidRankClass(rank.limitedClass)) {
    delete rank.limitedClass;
    delete rank.limitedLevel;
    delete rank.limitedStep;
    delete rank.limitedPercentile;
    delete rank.limitedLeaderboardPlace;
  }
  console.log("> Upsert rank", arg, rank);

  const uuid = getLocalSetting("playerId") || "default";
  const { dispatch } = store;

  getData(`${uuid}-rank`, true).then((uuidData) => {
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

      putData<DbRankData>(`${uuid}-rank`, newData, true);
      pushRanks(uuid, newData);
    } else {
      putData<DbRankData>(
        `${uuid}-rank`,
        {
          ...defaultRankData,
          updated: new Date().getTime(),
        },
        true
      );
    }
  });
}
