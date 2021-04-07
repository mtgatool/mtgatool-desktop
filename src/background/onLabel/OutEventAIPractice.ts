import LogEntry from "../../types/logDecoder";

interface EntryJson {
  params: {
    deck: string;
  };
}

interface Entry extends LogEntry {
  json: EntryJson;
}

export default function OutEventAIPractice(entry: Entry): void {
  const _json = entry.json;
}
