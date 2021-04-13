export default function getWinrateClass(wr: number, bright = true): string {
  if (wr > 0.65) return bright ? "blue-bright" : "blue";
  if (wr > 0.55) return bright ? "green-bright" : "green";
  if (wr < 0.45) return bright ? "orange-bright" : "orange";
  if (wr < 0.35) return bright ? "red-bright" : "red";
  return bright ? "white-bright" : "white";
}
