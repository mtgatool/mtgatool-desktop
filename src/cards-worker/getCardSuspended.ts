import allFormats from "./allFormats";
import CardType from "./typesWrap";

export default function getCardSuspended(card: CardType): string[] {
  const suspended: string[] = [];
  Object.keys(allFormats).forEach((name) => {
    const format = allFormats[name];
    if (format.suspendedTitleIds.includes(card.TitleId)) {
      suspended.push(name);
    }
  });
  return suspended;
}
