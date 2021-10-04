const suffixLength = "#12345".length;

export default function getPlayerNameWithoutSuffix(
  playerName: string | undefined
): string {
  return playerName ? playerName.slice(0, -suffixLength) : "-";
}
