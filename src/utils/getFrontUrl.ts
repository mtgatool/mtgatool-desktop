import database from "./database-wrapper";
import notFound from "../assets/images/notfound.png";

export default function getFrontUrl(
  hoverGrpId: number,
  quality: string
): string {
  const cardObj = database.card(hoverGrpId);
  let newImg;
  try {
    newImg = cardObj?.images[quality] || notFound;
  } catch (e) {
    newImg = notFound;
  }
  return newImg;
}
