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
};

(window as any).globalData = globalData;

export default globalData;
