import { Cards } from "mtgatool-shared";
import getGunUser from "./getGunUser";
import gunRefExists from "./gunRefExists";

export default async function upsertGunCards(cards: Cards) {
  const userRef = getGunUser();
  if (userRef) {
    const cardsUpdatedExists = await gunRefExists(userRef.get("cardsUpdated"));

    if (cardsUpdatedExists) {
      const lastUpdated = await userRef.get("cardsUpdated").then();
      if (new Date().getTime() < lastUpdated - 1000 * 60 * 24) {
        userRef.get("cards").open((data) => {
          userRef.get("cardsPrev").put(data);
          userRef.get("cards").put(cards);
          userRef.get("cardsUpdated").put(new Date().getTime());
        });
      }
    } else {
      userRef.get("cardsPrev").put(cards);
      userRef.get("cards").put(cards);
      userRef.get("cardsUpdated").put(new Date().getTime());
    }
  }
}
