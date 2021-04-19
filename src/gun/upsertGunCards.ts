import { Cards } from "mtgatool-shared";
import getLocalSetting from "../utils/getLocalSetting";
import objToBase from "../utils/objToBase";
import baseToObj from "../utils/baseToObj";
import getGunUser from "./getGunUser";
import gunRefExists from "./gunRefExists";

export default async function upsertGunCards(cards: Cards) {
  const uuid = getLocalSetting("playerId");
  const userRef = getGunUser();
  window.cards = cards;
  if (userRef) {
    const uuidDataRef = userRef.get("uuidData").get(uuid);
    const cardsUpdatedExists = await gunRefExists(
      uuidDataRef.get("cardsUpdated")
    );

    const cardsDataExists = await gunRefExists(uuidDataRef.get("cards"));
    if (cardsUpdatedExists && cardsDataExists) {
      const lastUpdated = await uuidDataRef.get("cardsUpdated").then();
      if (new Date().getTime() - lastUpdated > 1000 * 60 * 24) {
        uuidDataRef.get("cards").once((data) => {
          console.log("uuidDataRef cards", data);
          if (data) {
            try {
              window.cardsPrev = baseToObj(data);
            } catch (e) {
              console.error(e);
            }
            uuidDataRef.get("cardsPrev").put(data);
            uuidDataRef.get("cards").put(objToBase(cards));
            uuidDataRef.get("cardsUpdated").put(new Date().getTime());
          }
        });
      } else {
        uuidDataRef.get("cards").put(objToBase(cards));
      }
    } else {
      uuidDataRef.get("cardsPrev").put(objToBase(cards));
      uuidDataRef.get("cards").put(objToBase(cards));
      uuidDataRef.get("cardsUpdated").put(new Date().getTime());
    }
  }
}
