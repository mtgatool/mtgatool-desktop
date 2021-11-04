import Automerge from "automerge";
import setupIdb from "../toolDb/setupIdb";

export type CRDT = Record<string, number>;

const idb: any = setupIdb();
idb.start();

const globalData = {
  backgroundProcess: null as any | null,
  broadcastChannel: null as BroadcastChannel | null,
  documentKeyDownListeners: {} as Record<string, (e: KeyboardEvent) => void>,
  documentKeyUpListeners: {} as Record<string, (e: KeyboardEvent) => void>,
  mouseX: 0,
  mouseY: 0,
  CRDTList: {} as CRDT,
  matchesIndex: Automerge.init<{ index: string[] }>(),
  liveFeed: Automerge.init<Record<string, number>>(),
  idb,
};

(window as any).globalData = globalData;

export default globalData;
