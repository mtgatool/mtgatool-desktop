export default function getCardTypeSort(a?: string): number {
  if (a == undefined) return 0;
  if (a.includes("Creature", 0)) return 1;
  if (a.includes("Planeswalker", 0)) return 2;
  if (a.includes("Instant", 0)) return 3;
  if (a.includes("Sorcery", 0)) return 4;
  if (a.includes("Artifact", 0)) return 5;
  if (a.includes("Enchantment", 0)) return 6;
  if (a.includes("Land", 0)) return 7;
  if (a.includes("Special", 0)) return 8;
  return 0;
}
