import { v2cardsList, v3cardsList } from "../types";

export default function convertV3ListToV2(orig: v3cardsList): v2cardsList {
  const newList: v2cardsList = [];

  // 2026 deck payloads may omit list fields entirely; guard against a
  // missing/non-array input so the log worker doesn't crash mid-read.
  if (!Array.isArray(orig)) return newList;

  for (let i = 0; i < orig.length; i += 2) {
    const id = orig[i];
    const quantity = orig[i + 1];
    newList.push({ id, quantity });
  }

  return newList;
}
