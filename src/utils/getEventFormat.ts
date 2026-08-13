import isLimitedEventId from "./isLimitedEventId";

/**
 * Coarse format bucket for an event id, for "formats played" summaries.
 * Order matters: an id like Play_Brawl_Historic is Brawl, not Historic, and
 * Timeless_Ladder is Timeless, not Standard.
 */
export default function getEventFormat(eventId: string): string {
  if (isLimitedEventId(eventId)) return "Limited";
  const id = eventId.toLowerCase();
  if (id.includes("brawl")) return "Brawl";
  if (id.includes("alchemy")) return "Alchemy";
  if (id.includes("timeless")) return "Timeless";
  if (id.includes("historic")) return "Historic";
  if (id.includes("explorer")) return "Explorer";
  if (id.includes("pauper")) return "Pauper";
  if (
    id.includes("standard") ||
    id.includes("constructed") ||
    id.includes("ladder") ||
    id.includes("play")
  ) {
    return "Standard";
  }
  return "Other";
}
