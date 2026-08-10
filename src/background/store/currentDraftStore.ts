import { InternalDraftv2 } from "../../types";
import globalStore from ".";

export function createDraftState(): InternalDraftv2 {
  return {
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
    pickedCards: [],
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
  };
}

export function setDraftId(arg: string): void {
  globalStore.currentDraft.id = arg;
}

export function setDraftData(arg: Partial<InternalDraftv2>): void {
  globalStore.currentDraft = { ...globalStore.currentDraft, ...arg };
}

export function resetCurrentDraft(): void {
  globalStore.currentDraft = createDraftState();
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
