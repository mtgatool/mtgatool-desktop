import { Cards } from "mtgatool-shared";
import getLocalSetting from "../utils/getLocalSetting";
import getGunUser from "./getGunUser";
import gunRefExists from "./gunRefExists";

export default async function upsertGunCards(cards: Cards) {
  const uuid = getLocalSetting("playerId");
  const userRef = getGunUser();
  if (userRef) {
    const uuidDataRef = userRef.get("uuidData").get(uuid);
    const cardsUpdatedExists = await gunRefExists(
      uuidDataRef.get("cardsUpdated")
    );

    if (cardsUpdatedExists) {
      const lastUpdated = await uuidDataRef.get("cardsUpdated").then();
      if (new Date().getTime() < lastUpdated - 1000 * 60 * 24) {
        uuidDataRef.get("cards").open((data) => {
          window.cardsPrev = data;
          window.cards = cards;
          uuidDataRef.get("cardsPrev").put(data);
          uuidDataRef.get("cards").put(cards);
          uuidDataRef.get("cardsUpdated").put(new Date().getTime());
        });
      }
    } else {
      window.cardsPrev = cards;
      window.cards = cards;
      uuidDataRef.get("cardsPrev").put(cards);
      uuidDataRef.get("cards").put(cards);
      uuidDataRef.get("cardsUpdated").put(new Date().getTime());
    }
  }
}
