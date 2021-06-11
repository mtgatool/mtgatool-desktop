import { constants } from "mtgatool-shared";
import database from "./database-wrapper";

const {
  FACE_DFC_FRONT,
  FACE_DFC_BACK,
  FACE_MODAL_BACK,
  FACE_MODAL_FRONT,
} = constants;

export default function isCardDfc(grpId: number) {
  const cardObj = database.card(grpId);
  return (
    cardObj &&
    (cardObj.dfc == FACE_DFC_BACK ||
      cardObj.dfc == FACE_DFC_FRONT ||
      cardObj.dfc == FACE_MODAL_BACK ||
      cardObj.dfc == FACE_MODAL_FRONT)
  );
}
