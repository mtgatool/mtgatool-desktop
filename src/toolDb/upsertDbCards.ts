import { Cards } from "mtgatool-shared";
import { UserCardsData } from "../types/dbTypes";

export default async function upsertDbCards(cards: Cards) {
  console.log("> Upsert cards", cards);

  window.toolDb
    .getData<UserCardsData>("cards", true)
    .then((cardsData) => {
      if (cardsData) {
        if (new Date().getTime() - cardsData.updated > 1000 * 60 * 24) {
          window.toolDb.putData<UserCardsData>(
            "cards",
            {
              cards,
              prevCards: cardsData.cards,
              updated: new Date().getTime(),
            },
            true
          );
        } else {
          window.toolDb.putData<UserCardsData>(
            "cards",
            {
              cards,
              prevCards: cardsData.prevCards,
              updated: cardsData.updated,
            },
            true
          );
        }
      }
    })
    .catch((_e) => {
      window.toolDb.putData<UserCardsData>(
        "cards",
        {
          cards,
          prevCards: cards,
          updated: new Date().getTime(),
        },
        true
      );
    });
}
