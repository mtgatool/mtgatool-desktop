export default function getPlayerNameWithoutSuffix(
  playerName: string | undefined
): string {
  const hashPos = playerName?.indexOf("#") || -1;
  return playerName
    ? playerName.slice(0, hashPos > -1 ? hashPos : playerName.length)
    : "-";
}
