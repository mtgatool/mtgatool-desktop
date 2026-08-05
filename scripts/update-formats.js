#!/usr/bin/env node
/**
 * Refresh the bundled formats snapshots from an MTGA Player.log.
 *
 * Formats only ever come from Arena itself: the client answers a `GetFormats`
 * request with the whole table — legal sets, ban lists, deck quotas. The app
 * has handlers for that event (`onLabel/GetPlayerInventoryGetFormats`) but they
 * discard the payload, so the two snapshots below are the only format data the
 * app has, and they are only as fresh as the last time someone ran this.
 *
 * Both outputs are generated because there are two independent copies:
 *   - src/assets/resources/formats.json  -> src/common/allFormats.ts (UI)
 *   - src/cards-worker/allFormats.ts     -> the cards worker, which cannot
 *     import from src/assets (it is bundled separately), hence the inline copy.
 *
 * Usage:  node scripts/update-formats.js [path/to/Player.log]
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const DEFAULT_LOGS = [
  path.join(os.homedir(), "Library/Logs/Wizards Of The Coast/MTGA/Player.log"),
  path.join(
    os.homedir(),
    "AppData/LocalLow/Wizards Of The Coast/MTGA/Player.log"
  ),
];

const REPO = path.join(__dirname, "..");
const JSON_OUT = path.join(REPO, "src/assets/resources/formats.json");
const TS_OUT = path.join(REPO, "src/cards-worker/allFormats.ts");

// Arena switched these from strings to numeric `*Internal` enums somewhere
// after the Dec 2024 snapshot. The mappings were derived by correlating every
// format present in both that snapshot and a current log — all three are 1:1
// with no conflicts.
const FORMAT_TYPE = { 1: "Draft", 2: "Sealed", 3: "Constructed" };
const CARD_COUNT_RESTRICTION = { 1: "Singleton", 2: "UnrestrictedCardCounts" };
const SIDEBOARD_BEHAVIOR = { 1: "CompanionOnly" };

/** Pull the JSON object that follows the last GetFormats response. */
function extractPayload(log) {
  const marker = /<== (?:PlayerInventory\.)?GetFormats\(/g;
  let start = -1;
  let match = marker.exec(log);
  while (match) {
    start = match.index;
    match = marker.exec(log);
  }
  if (start === -1) {
    throw new Error(
      "No `<== GetFormats` response in this log. Launch Arena and reach the " +
        "home screen at least once, then retry."
    );
  }

  const open = log.indexOf("{", start);
  if (open === -1) throw new Error("GetFormats response has no JSON body");

  // Brace-match rather than assuming one line: the payload is ~500 KB and
  // nothing guarantees Unity keeps it unwrapped.
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = open; i < log.length; i += 1) {
    const c = log[i];
    if (escaped) {
      escaped = false;
    } else if (c === "\\") {
      escaped = true;
    } else if (c === '"') {
      inString = !inString;
    } else if (!inString) {
      if (c === "{") depth += 1;
      else if (c === "}") {
        depth -= 1;
        if (depth === 0) return JSON.parse(log.slice(open, i + 1));
      }
    }
  }
  throw new Error("GetFormats JSON body is truncated");
}

const hasKeys = (o) => !!o && Object.keys(o).length > 0;

/**
 * Arena omits empty collections; the consumers do not tolerate that.
 * `getCardFormats`/`getCardBanned`/`getCardSuspended` all call `.includes()`
 * on these unconditionally, so a missing `bannedTitleIds` is a TypeError in
 * the worker. Every array/map is materialised, and key order matches the
 * previous snapshot to keep future diffs readable.
 */
function normalize(f) {
  const out = {
    name: f.name,
    legalSets: f.legalSets || [],
    filterSets: f.filterSets || [],
    bannedTitleIds: f.bannedTitleIds || [],
    suspendedTitleIds: f.suspendedTitleIds || [],
    allowedTitleIds: f.allowedTitleIds || [],
    supressedTitleIds: f.supressedTitleIds || [],
    individualCardQuotas: f.individualCardQuotas || {},
    FormatType: FORMAT_TYPE[f.FormatTypeInternal] || "Constructed",
  };

  // Arena sends `{}` for a quota that does not apply, but `Format` types these
  // as fully-populated ranges. Omitting them matches the optional fields.
  if (hasKeys(f.mainDeckQuota)) out.mainDeckQuota = f.mainDeckQuota;
  if (hasKeys(f.sideBoardQuota)) out.sideBoardQuota = f.sideBoardQuota;
  out.AllowedCommanderTitleIds = f.AllowedCommanderTitleIds || [];
  if (f.useRebalancedCards !== undefined) {
    out.useRebalancedCards = f.useRebalancedCards;
  }

  const restriction = CARD_COUNT_RESTRICTION[f.CardCountRestrictionInternal];
  if (restriction) out.cardCountRestriction = restriction;
  if (hasKeys(f.commandZoneQuota)) out.commandZoneQuota = f.commandZoneQuota;
  const sideboard = SIDEBOARD_BEHAVIOR[f.SideboardBehaviorInternal];
  if (sideboard) out.sideboardBehavior = sideboard;

  return out;
}

const logPath = process.argv[2] || DEFAULT_LOGS.find((p) => fs.existsSync(p));
if (!logPath || !fs.existsSync(logPath)) {
  console.error("Could not find a Player.log. Pass one as an argument.");
  process.exit(1);
}

const payload = extractPayload(fs.readFileSync(logPath, "utf8"));

// Sorted so a future refresh produces a diff you can actually read; Arena's
// own ordering is not stable between runs.
const Formats = payload.Formats.map(normalize).sort((a, b) =>
  a.name.localeCompare(b.name)
);

// Arena repeats the same handful of groups once per format-ish; dedupe on name.
const seen = new Set();
const FormatGroups = (payload.FormatGroups || [])
  .filter((g) => !seen.has(g.GroupName) && seen.add(g.GroupName))
  .sort((a, b) => a.GroupName.localeCompare(b.GroupName));

const data = { Formats, FormatGroups };

fs.writeFileSync(JSON_OUT, `${JSON.stringify(data, null, 1)}\n`);

fs.writeFileSync(
  TS_OUT,
  `// GENERATED by scripts/update-formats.js — do not edit by hand.
// Source: Arena's GetFormats log response. Re-run the script to refresh.
import { Format } from "../background/onLabel/InGetFormats";

export interface FormatGroup {
  FormatNames: string[];
  GroupName: string;
}

interface FormatsJSON {
  Formats: Format[];
  FormatGroups: FormatGroup[];
}

const formatsJson: FormatsJSON = ${JSON.stringify(data, null, 2)};

const allFormats: Record<string, Format> = {};
formatsJson.Formats.forEach((format) => {
  allFormats[format.name] = format;
});

export default allFormats;
`
);

console.log(`Source: ${logPath}`);
console.log(`Formats: ${Formats.length}  FormatGroups: ${FormatGroups.length}`);
const std = Formats.find((f) => f.name === "Standard");
if (std) console.log(`Standard: ${std.legalSets.join(", ")}`);
console.log(`Wrote ${path.relative(REPO, JSON_OUT)}`);
console.log(`Wrote ${path.relative(REPO, TS_OUT)}`);
