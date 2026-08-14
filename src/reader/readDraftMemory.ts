import isElectron from "../utils/electron/isElectron";
import { getReader, MemoryDraft } from "../utils/mtgaReader";

export type { MemoryDraft } from "../utils/mtgaReader";

/**
 * Read the active draft from game memory. Both draft flavours (BotDraftPod /
 * HumanDraftPod) come back in one shape, 0-indexed. Returns null when there is
 * no active draft, the reader is unavailable, or the read fails — callers
 * treat memory as an optional extra source over the log, never a requirement.
 */
export default async function readDraftMemory(): Promise<MemoryDraft | null> {
  if (!isElectron()) return null;

  try {
    const reader = getReader();
    if (typeof reader.readDraft !== "function") return null;

    const draft = await reader.readDraft("MTGA");
    if (!draft || draft.error) return null;
    return draft;
  } catch (e) {
    console.error("readDraftMemory failed", e);
    return null;
  }
}
