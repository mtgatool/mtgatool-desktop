export default function getRankColorClass(rank: string): string {
  switch (rank) {
    case "A+":
    case "A":
      return "blue";
    case "A-":
    case "B+":
    case "B":
      return "green";
    case "B-":
    case "C+":
    case "C":
    default:
      return "white";
    case "C-":
    case "D+":
    case "D":
      return "orange";
    case "D-":
    case "F":
      return "red";
  }
}
