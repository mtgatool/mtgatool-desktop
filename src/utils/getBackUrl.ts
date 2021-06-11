import notFound from "../assets/images/notfound.png";
import database from "./database-wrapper";
import isCardDfc from "./isCardDfc";

export default function getBackUrl(
  hoverGrpId: number,
  quality: string
): string {
  let cardObj = database.card(hoverGrpId);
  let newImg;
  if (cardObj?.dfcId && cardObj.dfcId !== true && isCardDfc(hoverGrpId)) {
    cardObj = database.card(cardObj.dfcId);
    try {
      newImg = cardObj?.images[quality];
    } catch (e) {
      newImg = notFound;
    }
  }
  return newImg || notFound;
}
