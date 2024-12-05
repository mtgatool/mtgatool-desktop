export default function getRaritySortValue(rarity: string): number {
  const lowercaseRarity = rarity.toLowerCase();
  switch (lowercaseRarity) {
    case "land":
      return 5;
    case "common":
      return 4;
    case "uncommon":
      return 3;
    case "rare":
      return 2;
    case "mythic":
      return 1;
    default:
      return 0;
  }
}
