import { DbCardData } from "mtgatool-shared/dist";
import allFormats from "../../../../common/allFormats";

export default function getCardSuspended(card: DbCardData): string[] {
  const suspended: string[] = [];
  Object.keys(allFormats).forEach((name) => {
    const format = allFormats[name];
    if (format.suspendedTitleIds.includes(card.titleId)) {
      suspended.push(name);
    }
  });
  return suspended;
}
