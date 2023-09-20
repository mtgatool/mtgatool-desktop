import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: any;
}

export default function BusinessEvent(entry: Entry): void {
  const { json } = entry;

  if (json.EventType === 44) {
    // Social id update, ignore
    // console.log("BusinessEvent", json);
  }
}
