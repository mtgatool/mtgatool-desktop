/**
 * Live overlay sharing (Supabase Realtime Broadcast), driven per overlay.
 *
 * Each sharing-enabled overlay WINDOW publishes its own state to one Realtime
 * channel ("overlay-<shareId>"); the public web viewer
 * (app.mtgatool.com/live/<shareId>) subscribes and renders the same
 * OverlayContent. Nothing is written to the database — broadcast is ephemeral
 * pub/sub.
 *
 * Publishing lives in the overlay window (not the hidden background window) on
 * purpose: overlays are visible during a match, so their Realtime socket isn't
 * subject to the background-renderer throttling that would starve the heartbeat
 * and drop the connection. Each call is throttled per shareId, with a keepalive
 * that re-pushes the latest state so late-joining viewers catch up and a dropped
 * channel self-heals.
 */
import { OverlaySettings } from "../common/defaultConfig";
import supabase from "./supabase";

interface LiveChannel {
  channel: ReturnType<typeof supabase.channel>;
  joined: boolean;
  closing?: boolean;
}

// The full payload a viewer needs to render OverlayContent for any mode.
export interface OverlaySharePayload {
  matchState: unknown;
  settings: OverlaySettings;
  actionLog?: unknown;
  draftState?: unknown;
  draftVotes?: unknown;
}

interface PerShare {
  latest: OverlaySharePayload | null;
  lastPublish: number;
  trailing: ReturnType<typeof setTimeout> | null;
  keepalive: ReturnType<typeof setInterval> | null;
}

const THROTTLE_MS = 1000;
const KEEPALIVE_MS = 3000;

const channels = new Map<string, LiveChannel>();
const shares = new Map<string, PerShare>();

// Tear a channel down exactly once. removeChannel() unsubscribes, which fires
// the subscribe status callback again with CLOSED — calling removeChannel from
// there would recurse forever (stack overflow), so guard on `closing`, drop it
// from the map synchronously, and defer the actual removal out of the current
// call stack.
function dropChannel(shareId: string, live: LiveChannel): void {
  if (live.closing) return;
  // eslint-disable-next-line no-param-reassign
  live.closing = true;
  if (channels.get(shareId) === live) channels.delete(shareId);
  setTimeout(() => {
    try {
      supabase.removeChannel(live.channel);
    } catch {
      // already gone
    }
  }, 0);
}

function getChannel(shareId: string): LiveChannel {
  let live = channels.get(shareId);
  if (!live) {
    const channel = supabase.channel(`overlay-${shareId}`, {
      config: { broadcast: { ack: true } },
    });
    live = { channel, joined: false };
    const ref = live;
    channel.subscribe((status) => {
      ref.joined = status === "SUBSCRIBED";
      // eslint-disable-next-line no-console
      console.log(`[liveShare] publisher overlay-${shareId} ${status}`);
      // CHANNEL_ERROR / TIMED_OUT: leave it — supabase auto-retries the join
      // with backoff and rejoins the SAME channel. Recreating on the same topic
      // would collide with that half-open join and wedge recovery.
      //
      // CLOSED: terminal in supabase-js — it will NOT auto-rejoin. If this
      // wasn't us stopping (closing flag), drop our map reference so the next
      // keepalive tick creates a fresh channel and reconnects. Delete the map
      // entry only; the channel is already closed, so calling removeChannel here
      // would just re-enter this callback.
      if (status === "CLOSED" && !ref.closing) {
        if (channels.get(shareId) === ref) channels.delete(shareId);
      }
    });
    channels.set(shareId, live);
  }
  return live;
}

function sendNow(shareId: string): void {
  const s = shares.get(shareId);
  if (!s || !s.latest) return;
  const live = getChannel(shareId);
  if (!live.joined) return; // not joined; Supabase is rejoining, keepalive retries
  live.channel
    .send({
      type: "broadcast",
      event: "overlay",
      payload: { ...s.latest, ts: new Date().getTime() },
    })
    .then((res) => {
      if (res !== "ok") {
        // eslint-disable-next-line no-console
        console.warn(`[liveShare] send overlay-${shareId} -> ${res}`);
      }
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.warn(`[liveShare] send overlay-${shareId} failed`, e);
    });
}

/**
 * Publish this overlay's current state to its channel, throttled (trailing edge
 * keeps the last state of a burst) with a keepalive re-push. Fire-and-forget;
 * never throws. Call from the overlay window while sharing is enabled.
 */
export function publishOverlayShare(
  shareId: string,
  payload: OverlaySharePayload
): void {
  try {
    let s = shares.get(shareId);
    if (!s) {
      s = { latest: null, lastPublish: 0, trailing: null, keepalive: null };
      shares.set(shareId, s);
    }
    s.latest = payload;
    if (!s.keepalive) {
      s.keepalive = setInterval(() => sendNow(shareId), KEEPALIVE_MS);
    }

    const now = new Date().getTime();
    if (now - s.lastPublish >= THROTTLE_MS) {
      s.lastPublish = now;
      sendNow(shareId);
    } else if (!s.trailing) {
      const wait = THROTTLE_MS - (now - s.lastPublish);
      s.trailing = setTimeout(() => {
        const cur = shares.get(shareId);
        if (cur) {
          cur.trailing = null;
          cur.lastPublish = new Date().getTime();
        }
        sendNow(shareId);
      }, wait);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("publishOverlayShare failed:", e);
  }
}

/** Stop sharing this overlay: clear timers and leave the channel. */
export function stopOverlayShare(shareId: string): void {
  const s = shares.get(shareId);
  if (s) {
    if (s.trailing) clearTimeout(s.trailing);
    if (s.keepalive) clearInterval(s.keepalive);
    shares.delete(shareId);
  }
  const live = channels.get(shareId);
  if (live) dropChannel(shareId, live);
}
