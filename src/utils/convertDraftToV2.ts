import {
  InternalDraft,
  InternalDraftPackPick,
  InternalDraftv2,
} from "../types";
import getSetCodeInEventId from "./getSetInEventId";
import database from "./mtga/database";

export default function convertDraftToV2(
  original: InternalDraft
): InternalDraftv2 {
  // declae empty as default
  const packs: InternalDraftv2["packs"] = [
    Array(16).fill([]) as number[][],
    Array(16).fill([]) as number[][],
    Array(16).fill([]) as number[][],
  ];
  const picks: InternalDraftv2["picks"] = [
    Array(16).fill(0) as number[],
    Array(16).fill(0) as number[],
    Array(16).fill(0) as number[],
  ];
  for (let p = 0; p < 3; p += 1) {
    for (let i = 0; i < 15; i += 1) {
      const key = `pack_${p}pick_${i}`;
      const pickPack = original[key] as InternalDraftPackPick;
      if (pickPack) {
        packs[p][i] = pickPack.pack.map((d) => parseInt(d, 10));
        picks[p][i] = parseInt(pickPack.pick, 10);
      }
    }
  }

  return {
    archived: false,
    owner: original.owner,
    arenaId: original.player,
    date: original.date,
    eventId: original.InternalEventName,
    id: original.id,
    draftSet:
      database.sets[original.set]?.arenacode ||
      getSetCodeInEventId(original.InternalEventName) ||
      "",
    currentPack: original.packNumber,
    currentPick: original.pickNumber,
    // removed number from the original CardPool to make this work
    // Basically we cant map a string[] | number[] array and get it
    // typed as a number[] automatically based on the map fn
    pickedCards:
      original.CardPool?.map((n: string | number) => parseInt(`${n}`, 10)) ||
      [],
    packs,
    picks,
    type: "draft",
  };
}
