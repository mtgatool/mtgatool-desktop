import allFormats from "./allFormats";
import CardType from "./typesWrap";

export default function getCardBanned(card: CardType): string[] {
  const banned: string[] = [];
  Object.keys(allFormats).forEach((name) => {
    const format = allFormats[name];
    if (format.bannedTitleIds.includes(card.TitleId)) {
      banned.push(name);
    }
  });
  return banned;
}
