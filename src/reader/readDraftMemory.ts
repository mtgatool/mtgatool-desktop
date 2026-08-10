import isElectron from "../utils/electron/isElectron";

/** The payload mtga-reader's readDraft returns for an active draft. */
export interface MemoryDraft {
  error?: string;
  eventName?: string;
  draftId?: string;
  draftState?: number;
  currentPack?: number;
  currentPick?: number;
  numCardsToPick?: number;
  packCards?: number[];
  /**
   * Picks in pick order, expanded by quantity. null (not []) while the draft
   * screen is closed — the pick list lives in the draft scene and is
   * unreadable until it reopens; position and pack stay valid.
   */
  pickedCards?: number[] | null;
  sideboardCards?: number[] | null;
  /** Human drafts only; null on bot drafts. */
  pickSecondsTotal?: number | null;
  passDirection?: number | null;
}

/**
 * Read the active draft from game memory. Both draft flavours (BotDraftPod /
 * HumanDraftPod) come back in one shape, 0-indexed. Returns null when there is
 * no active draft, the reader is unavailable, or the read fails — callers
 * treat memory as an optional extra source over the log, never a requirement.
 */
export default async function readDraftMemory(): Promise<MemoryDraft | null> {
  if (!isElectron()) return null;

  try {
    // eslint-disable-next-line no-undef
    const reader = __non_webpack_require__("mtga-reader");
    if (typeof reader.readDraft !== "function") return null;

    const draft: MemoryDraft = await reader.readDraft("MTGA");
    if (!draft || draft.error) return null;
    return draft;
  } catch (e) {
    console.error("readDraftMemory failed", e);
    return null;
  }
}
