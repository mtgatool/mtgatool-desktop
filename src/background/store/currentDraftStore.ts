import { InternalDraftv2 } from "mtgatool-shared";

import globalStore from ".";

export const draftStateObject = {
  archived: false,
  type: "draft",
  owner: "",
  arenaId: "",
  date: "",
  eventId: "",
  id: undefined,
  draftSet: "",
  currentPack: 0,
  currentPick: 0,
  pickedCards: [] as number[],
  packs: [
    Array(16).fill([]) as number[][],
    Array(16).fill([]) as number[][],
    Array(16).fill([]) as number[][],
  ],
  picks: [
    Array(16).fill(0) as number[],
    Array(16).fill(0) as number[],
    Array(16).fill(0) as number[],
  ],
} as InternalDraftv2;

export function setDraftId(arg: string): void {
  globalStore.currentDraft.id = arg;
}

export function setDraftData(arg: Partial<InternalDraftv2>): void {
  globalStore.currentDraft = { ...globalStore.currentDraft, ...arg };
}

export function resetCurrentDraft(): void {
  globalStore.currentDraft = { ...draftStateObject };
  globalStore.currentDraft.pickedCards = [];
  globalStore.currentDraft.packs = [
    Array(16).fill([]) as number[][],
    Array(16).fill([]) as number[][],
    Array(16).fill([]) as number[][],
  ];
  globalStore.currentDraft.picks = [
    Array(16).fill([]) as number[],
    Array(16).fill([]) as number[],
    Array(16).fill([]) as number[],
  ];
}

function setDraftPackPick(pack: number, pick: number): void {
  globalStore.currentDraft.currentPack = pack;
  globalStore.currentDraft.currentPick = pick;
}

export function setDraftPack(
  cards: number[],
  argPack: number | undefined,
  argPick: number | undefined
): void {
  const pack = argPack ?? globalStore.currentDraft.currentPack;
  const pick = argPick ?? globalStore.currentDraft.currentPick;
  setDraftPackPick(pack, pick);
  globalStore.currentDraft.packs[pack][pick] = cards;
}

export function addDraftPick(
  grpId: number,
  argPack: number | undefined,
  argPick: number | undefined
): void {
  const pack = argPack ?? globalStore.currentDraft.currentPack;
  const pick = argPick ?? globalStore.currentDraft.currentPick;
  setDraftPackPick(pack, pick);
  globalStore.currentDraft.pickedCards.push(grpId);
  globalStore.currentDraft.picks[pack][pick] = grpId;
}
