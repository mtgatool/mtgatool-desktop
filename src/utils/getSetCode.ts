import database from "./mtga/database";

export default function getSetCode(set: string): string {
  if (set == undefined) return "";
  let s = database.sets[set].code;
  if (s == undefined) s = set;
  return s;
}
