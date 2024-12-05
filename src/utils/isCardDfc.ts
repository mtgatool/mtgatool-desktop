import {
  FACE_DFC_BACK,
  FACE_DFC_FRONT,
  FACE_MODAL_BACK,
  FACE_MODAL_FRONT,
} from "../constants";
import database from "./database-wrapper";

export default function isCardDfc(grpId: number) {
  const cardObj = database.card(grpId);
  return (
    cardObj &&
    (cardObj.LinkedFaceType == FACE_DFC_BACK ||
      cardObj.LinkedFaceType == FACE_DFC_FRONT ||
      cardObj.LinkedFaceType == FACE_MODAL_BACK ||
      cardObj.LinkedFaceType == FACE_MODAL_FRONT)
  );
}
