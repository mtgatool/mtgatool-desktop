import allFormats from "./allFormats";

export default function getCardSuspended(card: any): string[] {
  const suspended: string[] = [];
  Object.keys(allFormats).forEach((name) => {
    const format = allFormats[name];
    if (format.suspendedTitleIds.includes(card.titleId)) {
      suspended.push(name);
    }
  });
  return suspended;
}
