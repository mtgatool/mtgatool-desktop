import notFound from "../assets/images/notfound.png";
import { DEFAULT_TILE } from "../constants";
import database from "./database-wrapper";
import { getCardImage } from "./getCardArtCrop";

export default function getBackUrl(
  hoverGrpId: number,
  quality: string
): string {
  const cardObj = database.card(hoverGrpId);
  const newImg = getCardImage(
    cardObj?.LinkedFaceGrpIds[0] || DEFAULT_TILE,
    quality
  );

  return newImg || notFound;
}
