import decksLoc from "../assets/loc/loc_Decks.json";

const deckKeyToName: Record<string, string> = {};

decksLoc.forEach((loc) => {
  deckKeyToName[loc.key] = loc.translations.filter(
    (t) => t.locale == "en-US"
  )[0].translation;
});

export default function getPreconDeckName(key: string): string {
  if (key.includes("?=?Loc")) {
    const replaced = key.replace("?=?Loc/", "");
    return deckKeyToName[replaced] || replaced.replace("Decks/Precon/", "");
  }
  return key;
}
