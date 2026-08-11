import { Format } from "../background/onLabel/InGetFormats";

/**
 * Normalize Arena's GetFormats response into the canonical snapshot shape —
 * the same rules scripts/update-formats.js applies when refreshing the
 * bundled copy, so a snapshot produced here is byte-comparable with
 * mtgatool-metadata's formats.json.
 *
 * Arena switched several fields from strings to numeric `*Internal` enums;
 * both spellings are accepted so old logs replay cleanly.
 */

const FORMAT_TYPE: Record<number, string> = {
  1: "Draft",
  2: "Sealed",
  3: "Constructed",
};
const CARD_COUNT_RESTRICTION: Record<number, string> = {
  1: "Singleton",
  2: "UnrestrictedCardCounts",
};
const SIDEBOARD_BEHAVIOR: Record<number, string> = { 1: "CompanionOnly" };

export interface FormatGroup {
  GroupName: string;
  FormatNames: string[];
}

export interface FormatsSnapshot {
  Formats: Format[];
  FormatGroups: FormatGroup[];
}

const hasKeys = (o: unknown): boolean =>
  !!o && Object.keys(o as Record<string, unknown>).length > 0;

/**
 * Arena omits empty collections; consumers do not tolerate that. Every
 * array/map is materialised, and key order is fixed so the serialized
 * snapshot (and therefore its hash) is stable.
 */
function normalizeFormat(f: any): Format {
  const out: any = {
    name: f.name,
    legalSets: f.legalSets || [],
    filterSets: f.filterSets || [],
    bannedTitleIds: f.bannedTitleIds || [],
    suspendedTitleIds: f.suspendedTitleIds || [],
    allowedTitleIds: f.allowedTitleIds || [],
    supressedTitleIds: f.supressedTitleIds || [],
    individualCardQuotas: f.individualCardQuotas || {},
    FormatType:
      f.FormatType || FORMAT_TYPE[f.FormatTypeInternal] || "Constructed",
  };

  // Arena sends `{}` for a quota that does not apply; omit it instead.
  if (hasKeys(f.mainDeckQuota)) out.mainDeckQuota = f.mainDeckQuota;
  if (hasKeys(f.sideBoardQuota)) out.sideBoardQuota = f.sideBoardQuota;
  out.AllowedCommanderTitleIds = f.AllowedCommanderTitleIds || [];
  if (f.useRebalancedCards !== undefined) {
    out.useRebalancedCards = f.useRebalancedCards;
  }

  const restriction =
    f.cardCountRestriction ||
    CARD_COUNT_RESTRICTION[f.CardCountRestrictionInternal];
  if (restriction) out.cardCountRestriction = restriction;
  if (hasKeys(f.commandZoneQuota)) out.commandZoneQuota = f.commandZoneQuota;
  const sideboard =
    f.sideboardBehavior || SIDEBOARD_BEHAVIOR[f.SideboardBehaviorInternal];
  if (sideboard) out.sideboardBehavior = sideboard;

  return out as Format;
}

export default function normalizeFormats(payload: {
  Formats: any[];
  FormatGroups?: FormatGroup[];
}): FormatsSnapshot | null {
  if (!payload || !Array.isArray(payload.Formats)) return null;
  if (payload.Formats.length === 0) return null;

  // Sorted so the same table always serializes (and hashes) the same way;
  // Arena's own ordering is not stable between runs.
  const Formats = payload.Formats.map(normalizeFormat).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Arena repeats the same handful of groups; dedupe on name.
  const seen = new Set<string>();
  const FormatGroups = (payload.FormatGroups || [])
    .filter((g) => !seen.has(g.GroupName) && !!seen.add(g.GroupName))
    .sort((a, b) => a.GroupName.localeCompare(b.GroupName));

  return { Formats, FormatGroups };
}
