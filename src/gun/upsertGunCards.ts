import { Cards } from "mtgatool-shared";
import getLocalSetting from "../utils/getLocalSetting";
import objToBase from "../utils/objToBase";
import getGunUser from "./getGunUser";
import gunRefExists from "./gunRefExists";

export default async function upsertGunCards(cards: Cards) {
  const uuid = getLocalSetting("playerId");
  const userRef = getGunUser();

  console.log("> Upsert cards", cards);

  if (userRef) {
    const uuidDataRef = userRef.get("uuidData").get(uuid);
    const cardsUpdatedExists = await gunRefExists(
      uuidDataRef.get("cardsUpdated")
    );
    const baseCards = objToBase(cards);

    const cardsDataExists = await gunRefExists(uuidDataRef.get("cards"));
    if (cardsUpdatedExists && cardsDataExists) {
      const lastUpdated = await uuidDataRef.get("cardsUpdated").then();
      if (new Date().getTime() - lastUpdated > 1000 * 60 * 24) {
        uuidDataRef.get("cards").once((data) => {
          // console.log("uuidDataRef cards", data);
          if (data) {
            uuidDataRef.get("cardsPrev").put(data);
            uuidDataRef.get("cards").put(baseCards);
            uuidDataRef.get("cardsUpdated").put(new Date().getTime());
          }
        });
      } else {
        uuidDataRef.get("cards").put(baseCards);
      }
    } else {
      uuidDataRef.get("cardsPrev").put(baseCards);
      uuidDataRef.get("cards").put(baseCards);
      uuidDataRef.get("cardsUpdated").put(new Date().getTime());
    }
  }
}
