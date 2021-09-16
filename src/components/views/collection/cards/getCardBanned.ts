import { DbCardData } from "mtgatool-shared/dist";
import allFormats from "../../../../common/allFormats";

export default function getCardBanned(card: DbCardData): string[] {
  const banned: string[] = [];
  Object.keys(allFormats).forEach((name) => {
    const format = allFormats[name];
    if (format.bannedTitleIds.includes(card.titleId)) {
      banned.push(name);
    }
  });
  return banned;
}
