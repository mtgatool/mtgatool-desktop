import { DbCardData } from "../../../../../../mtgatool-shared/dist";
import getCardFormats from "./getCardFormats";

export default function getCardIsCraftable(card: DbCardData): boolean {
  const formats = getCardFormats(card);
  if (
    formats.includes("Standard") ||
    formats.includes("Historic") ||
    formats.includes("Singleton")
  ) {
    return true;
  }
  return false;
}
