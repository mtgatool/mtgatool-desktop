import { constants } from "mtgatool-shared";

import database from "./database-wrapper";

const { FACE_DFC_BACK, FACE_MODAL_BACK } = constants;

export default function isCardDfcBack(grpId: number) {
  const cardObj = database.card(grpId);
  return (
    cardObj &&
    (cardObj.LinkedFaceType == FACE_DFC_BACK ||
      cardObj.LinkedFaceType == FACE_MODAL_BACK ||
      cardObj.LinkedFaceType == 3)
  );
}
