import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: string;
}

export default function DetailedLogs(entry: Entry): void {
  const { json } = entry;
  postChannelMessage({
    type: "SET_DETAILED_LOGS",
    value: json,
  });

  console.log(`DETAILED LOGS ARE ${json}`);
}
