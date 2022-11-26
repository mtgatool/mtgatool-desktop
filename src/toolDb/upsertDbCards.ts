import { Cards } from "mtgatool-shared";

import reduxAction from "../redux/reduxAction";
import store from "../redux/stores/rendererStore";
import { DbCardsData, defaultCardsData } from "../types/dbTypes";
import getLocalSetting from "../utils/getLocalSetting";
import getLocalDbValue from "./getLocalDbValue";

export default async function upsertDbCards(cards: Cards) {
  console.log("> Upsert cards", cards);

  const uuid = getLocalSetting("playerId") || "default";
  const { dispatch } = store;

  getLocalDbValue(window.toolDb.getUserNamespacedKey(`${uuid}-cards`)).then(
    (uuidData) => {
      if (uuidData) {
        const newData = {
          cards,
          prevCards:
            new Date().getTime() - (uuidData as DbCardsData).updated >
            1000 * 60 * 24
              ? (uuidData as DbCardsData).cards
              : (uuidData as DbCardsData).prevCards,
          updated: new Date().getTime(),
        };

        reduxAction(dispatch, {
          type: "SET_UUID_CARDS_DATA",
          arg: { cards: newData, uuid },
        });

        window.toolDb.putData<DbCardsData>(`${uuid}-cards`, newData, true);
      } else {
        window.toolDb.putData<DbCardsData>(
          `${uuid}-cards`,
          {
            ...defaultCardsData,
            cards,
            updated: new Date().getTime(),
          },
          true
        );
      }
    }
  );
}
