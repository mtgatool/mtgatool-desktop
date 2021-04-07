const suffixLength = "#12345".length;

export default function getPlayerNameWithoutSuffix(playerName: string): string {
  return playerName.slice(0, -suffixLength);
}
