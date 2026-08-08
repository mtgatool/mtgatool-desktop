import Automerge from "automerge";

const globalData = {
  backgroundProcess: null as any | null,
  broadcastChannel: null as BroadcastChannel | null,
  documentKeyDownListeners: {} as Record<string, (e: KeyboardEvent) => void>,
  documentKeyUpListeners: {} as Record<string, (e: KeyboardEvent) => void>,
  mouseX: 0,
  mouseY: 0,
  fetchedAvatars: [] as string[],
  matchesIndex: [] as string[],
  draftsIndex: [] as string[],
  hiddenDecks: [] as string[],
  liveFeed: Automerge.init<Record<string, number>>(),
  lastLogCheck: 0,
  /**
   * The most recent memory reads, newest last. Bounded because this is a live
   * view of what the reader is doing, not a log — the settings page draws the
   * tail of it and nothing needs the rest.
   */
  readerReads: [] as {
    kind: "memory" | "log";
    name: string;
    ms: number;
    ok: boolean;
    at: number;
    error?: string;
    count?: number;
  }[],
};

(window as any).globalData = globalData;

export default globalData;
