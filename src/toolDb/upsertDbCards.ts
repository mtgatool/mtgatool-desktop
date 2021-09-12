import { Cards } from "mtgatool-shared";
import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { DbUUIDData, defaultUUIDData } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";

export default async function upsertDbRank(cards: Cards) {
  console.log("> Upsert cards", cards);

  const uuid = getLocalSetting("playerId") || "default";
  const { dispatch } = store;

  return window.toolDb
    .getData<DbUUIDData>(`${uuid}-data`, true)
    .then((uuidData) => {
      if (uuidData) {
        const newData = {
          ...uuidData,
          cards,
          prevCards:
            new Date().getTime() - uuidData.updatedCards > 1000 * 60 * 24
              ? uuidData.cards
              : uuidData.prevCards,
          updatedCards: new Date().getTime(),
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
            cards: cards,
            updated: new Date().getTime(),
          },
          true
        );
      }
    });
}
