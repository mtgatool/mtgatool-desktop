import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: string;
}

export default function DetailedLogs(entry: Entry): void {
  const { json } = entry;
  console.log(`DETAILED LOGS ARE ${json}`);
}
