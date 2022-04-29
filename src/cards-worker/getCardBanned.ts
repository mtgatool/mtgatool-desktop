import allFormats from "./allFormats";

export default function getCardBanned(card: any): string[] {
  const banned: string[] = [];
  Object.keys(allFormats).forEach((name) => {
    const format = allFormats[name];
    if (format.bannedTitleIds.includes(card.titleId)) {
      banned.push(name);
    }
  });
  return banned;
}
