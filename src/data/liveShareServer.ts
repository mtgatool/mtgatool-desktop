/**
 * Live overlay sharing — background-window side.
 *
 * The overlay windows post their state over the broadcast channel rather than
 * writing to Supabase directly (see `liveShare.ts` for why). This runs in the
 * background window — the one window that stays alive and keeps a valid session
 * — and performs the authenticated upsert/delete against `live_overlays` so the
 * write carries the logged-in user's JWT and satisfies RLS.
 */
import { ChannelMessage } from "../broadcastChannel/channelMessages";
import bcConnect from "../utils/bcConnect";
import supabase from "./supabase";

// A write in flight per shareId. The overlay re-sends on its throttle/keepalive
// beat, so dropping a message that arrives mid-write just defers it to the next
// beat (~1s) instead of letting writes pile up — matching the old inflight guard.
const inflight = new Set<string>();

let serving = false;

function upsert(shareId: string, payload: unknown): void {
  if (inflight.has(shareId)) return;
  inflight.add(shareId);
  supabase
    .from("live_overlays")
    .upsert(
      {
        share_id: shareId,
        payload: payload as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "share_id" }
    )
    .then(({ error }) => {
      inflight.delete(shareId);
      if (error) {
        // eslint-disable-next-line no-console
        console.warn(`[liveShare] upsert ${shareId} failed:`, error.message);
      }
    });
}

function remove(shareId: string): void {
  supabase
    .from("live_overlays")
    .delete()
    .eq("share_id", shareId)
    .then(({ error }) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.warn(`[liveShare] delete ${shareId} failed:`, error.message);
      }
    });
}

/**
 * Listen for overlay share publish/stop messages and write them to Supabase.
 * Idempotent — safe to call once from the background window's bootstrap.
 */
export default function serveLiveShareRequests(): void {
  if (serving) return;
  serving = true;
  const channel = bcConnect() as BroadcastChannel;
  channel.addEventListener("message", (e: MessageEvent) => {
    const data = e.data as ChannelMessage | undefined;
    if (!data) return;
    if (data.type === "LIVE_SHARE_PUBLISH") {
      upsert(data.value.shareId, data.value.payload);
    } else if (data.type === "LIVE_SHARE_STOP") {
      remove(data.value.shareId);
    }
  });
}
