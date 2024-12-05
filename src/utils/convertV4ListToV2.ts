import { v2cardsList, v4cardsList } from "../types";

export default function convertV4ListToV2(orig: v4cardsList): v2cardsList {
  const newList: v2cardsList = [];

  for (let i = 0; i < orig.length; i += 1) {
    const c = orig[i];
    newList.push({ id: c.cardId, quantity: c.quantity });
  }

  return newList;
}
