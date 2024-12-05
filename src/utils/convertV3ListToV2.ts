import { v2cardsList, v3cardsList } from "../types";

export default function convertV3ListToV2(orig: v3cardsList): v2cardsList {
  const newList: v2cardsList = [];

  for (let i = 0; i < orig.length; i += 2) {
    const id = orig[i];
    const quantity = orig[i + 1];
    newList.push({ id, quantity });
  }

  return newList;
}
