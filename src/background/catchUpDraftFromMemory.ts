import postChannelMessage from "../broadcastChannel/postChannelMessage";
import readDraftMemory from "../reader/readDraftMemory";
import getLocalSetting from "../utils/getLocalSetting";
import getSetInEventId from "../utils/getSetInEventId";
import loadDraftRatings from "../utils/seventeenLands";
import globalStore from "./store";
import {
  setDraftData,
  setDraftId,
  setDraftPack,
} from "./store/currentDraftStore";

/**
 * Seed the current draft from game memory — the case the log cannot cover:
 * the app opened mid-draft, so the join/status entries replayed by nothing.
 *
 * Memory carries the position, the pack on offer and (while the draft screen
 * is open) the full pick history in order; past packs exist nowhere on the
 * client, so replays of the pre-catch-up stretch render from the picks alone.
 * Runs once after the log catch-up finishes; the live entries take over from
 * there.
 */
export default async function catchUpDraftFromMemory(): Promise<void> {
  const memory = await readDraftMemory();
  if (!memory || memory.draftState !== 2) return;
  // Registry pods outlive their draft with draftState still 2 — seeding from
  // one resurrects a finished draft. Only the draft screen itself proves the
  // draft is live; with the screen closed, catch-up simply waits for it.
  if (memory.source !== "screen") return;

  const draft = globalStore.currentDraft;
  const eventName = memory.eventName || draft.eventId;
  if (!eventName) return;

  if (!draft.eventId) {
    setDraftData({
      eventId: eventName,
      draftSet: getSetInEventId(eventName) ?? "",
      date: draft.date || new Date().toISOString(),
      arenaId: draft.arenaId || getLocalSetting("playerId"),
    });
  }

  // Human pods carry the DraftId; bot pods leave it empty and the record id
  // comes from the course (EventJoin / courses refresh) instead.
  if (!globalStore.currentDraft.id) {
    const course = globalStore.currentCourses[eventName];
    // Course id first — it is what the log-driven handlers key records by;
    // the pod's DraftId is a different GUID and would fork the record.
    const id = (course && course.CourseId) || memory.draftId || undefined;
    if (id) setDraftId(id);
  }

  // The server-truth pick list beats whatever partial state the log gave us.
  if (
    Array.isArray(memory.pickedCards) &&
    memory.pickedCards.length > globalStore.currentDraft.pickedCards.length
  ) {
    setDraftData({ pickedCards: memory.pickedCards });
  }

  if (
    memory.packCards &&
    memory.packCards.length > 0 &&
    memory.currentPack !== undefined &&
    memory.currentPick !== undefined
  ) {
    setDraftPack(memory.packCards, memory.currentPack, memory.currentPick);
  }

  loadDraftRatings(eventName);
  postChannelMessage({ type: "DRAFT_STATUS", value: globalStore.currentDraft });
  console.log(
    `[draft] caught up from memory: ${eventName} pack ${memory.currentPack} pick ${memory.currentPick}`
  );
}
