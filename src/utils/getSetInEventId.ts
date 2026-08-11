import database from "./mtga/database";

export default function getSetInEventId(
  eventId: string | undefined
): string | undefined {
  if (!eventId) {
    return undefined;
  }

  // An empty arenacode (indexOf("") is 0) would "match" every event id and,
  // coming earlier in table order, shadow the real set.
  const setCodes = Object.keys(database.sets)
    .filter((setName) => {
      const code = database.sets[setName].arenacode;
      return code !== "" && eventId.indexOf(code) !== -1;
    })
    .map((setName) => database.sets[setName].arenacode);

  return setCodes[0] || undefined;
}
