import LogEntry from "../../types/logDecoder";

interface Cards {
  [grpId: string]: number;
}

interface Entry extends LogEntry {
  json: () => Cards;
}

export default function InPlayerInventoryGetPlayerCardsV3(entry: Entry): void {
  const _json = entry.json;
}
