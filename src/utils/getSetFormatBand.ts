import allFormats from "../common/allFormats";
import database from "./mtga/database";

export type SetFormatBand =
  | "standard"
  | "explorer"
  | "historic"
  | "alchemy"
  | "other";

const legalSets = (format: string): string[] =>
  allFormats[format]?.legalSets ?? [];

/**
 * The band a set belongs to in the collection's set picker: the narrowest of
 * Standard/Explorer/Historic that admits it, Alchemy for the Y2x digital
 * releases, Other for the leftovers. Arena has no Pioneer; Explorer is its
 * equivalent and is what the format data actually carries.
 *
 * A set is listed under either its canonical or its Arena code depending on
 * the format, so both spellings are checked.
 */
export default function getSetFormatBand(setCode: string): SetFormatBand {
  const lower = setCode.toLowerCase();
  const entry = Object.values(database.sets).find(
    (s) =>
      s.code?.toLowerCase() === lower || s.arenacode?.toLowerCase() === lower
  );
  const codes = [entry?.code, entry?.arenacode, setCode].filter(
    (c): c is string => !!c
  );

  const inList = (list: string[]): boolean =>
    codes.some((c) => list.includes(c));
  if (inList(legalSets("Standard"))) return "standard";
  if (inList(legalSets("Explorer"))) return "explorer";
  if (inList(legalSets("Historic"))) return "historic";
  if (codes.some((c) => c.startsWith("Y2"))) return "alchemy";
  return "other";
}
