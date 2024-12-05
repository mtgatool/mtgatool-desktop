import database from "./mtga/database";

export default function findSetByCode(code: string) {
  const name = database.setNames[code];

  return name ? database.sets[name] : undefined;
}
