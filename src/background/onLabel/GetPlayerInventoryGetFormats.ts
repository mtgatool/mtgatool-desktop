import postChannelMessage from "../../broadcastChannel/postChannelMessage";
import LogEntry from "../../types/logDecoder";
import normalizeFormats, { FormatGroup } from "../../utils/normalizeFormats";

interface Entry extends LogEntry {
  // 2026 clients answer with { Formats, FormatGroups }; older logs carried a
  // bare array.
  json: { Formats: any[]; FormatGroups?: FormatGroup[] } | any[];
}

/**
 * Arena's whole formats table — legal sets, ban lists, deck quotas. It exists
 * nowhere but this response, so broadcast the normalized snapshot for the
 * main window to version and upload (mtgatool-metadata syncs its formats.json
 * from those uploads).
 */
export default function GetPlayerInventoryGetFormats(entry: Entry): void {
  const { json } = entry;
  if (!json) return;

  const payload = Array.isArray(json) ? { Formats: json } : json;
  const snapshot = normalizeFormats(payload);
  if (!snapshot) return;

  postChannelMessage({ type: "FORMATS_SNAPSHOT", value: snapshot });
}
