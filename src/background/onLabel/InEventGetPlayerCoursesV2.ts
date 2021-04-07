import { PlayerCourse } from "mtgatool-shared";
import LogEntry from "../../types/logDecoder";

interface Entry extends LogEntry {
  json: PlayerCourse[];
}

export default function InEventGetPlayerCoursesV2(entry: Entry): void {
  const _json = entry.json;
}
