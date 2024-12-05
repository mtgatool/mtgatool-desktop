import { FACE_DFC_BACK, FACE_MODAL_BACK } from "../constants";
import database from "./database-wrapper";

export default function isCardDfcBack(grpId: number) {
  const cardObj = database.card(grpId);
  return (
    cardObj &&
    (cardObj.LinkedFaceType == FACE_DFC_BACK ||
      cardObj.LinkedFaceType == FACE_MODAL_BACK ||
      cardObj.LinkedFaceType == 3)
  );
}
