/**
 * Live overlay sharing — overlay-window side.
 *
 * Each sharing-enabled overlay WINDOW publishes its current state so the public
 * web viewer (app.mtgatool.com/live/<shareId>) can render it. The overlay does
 * NOT write to Supabase itself: these always-on-top renderers are aggressively
 * suspended by Chromium and each hold their own Supabase client, so their auth
 * token routinely goes stale (or loses the refresh-token rotation race against
 * the other windows) and the write lands as `anon` — which RLS rejects with a
 * 42501 (surfaced as HTTP 401). Instead it posts the payload over the broadcast
 * channel; the always-alive background window, which keeps a valid session,
 * performs the authenticated upsert (see `liveShareServer.ts`).
 *
 * This module keeps the publish cadence (throttle + keepalive), so the *rate*
 * of writes is unchanged and, crucially, the row's lifetime still tracks the
 * window's: when the overlay closes its JS context is torn down, the keepalive
 * interval dies, the background stops hearing from it, and the row goes stale on
 * its own — exactly as when the overlay wrote directly.
 */
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import { OverlaySharePayload } from "./liveShareTypes";

export type { OverlaySharePayload } from "./liveShareTypes";

interface PerShare {
  latest: OverlaySharePayload | null;
  lastPublish: number;
  trailing: ReturnType<typeof setTimeout> | null;
  keepalive: ReturnType<typeof setInterval> | null;
}

// Publish cadence. Throttle collapses a burst of match updates to one write per
// second; the keepalive re-writes on a slower beat so a late-joining viewer
// still converges even if nothing changed.
const THROTTLE_MS = 1000;
const KEEPALIVE_MS = 3000;

const shares = new Map<string, PerShare>();

function sendNow(shareId: string): void {
  const s = shares.get(shareId);
  if (!s || !s.latest) return;
  postChannelMessage({
    type: "LIVE_SHARE_PUBLISH",
    value: { shareId, payload: s.latest },
  });
}

/**
 * Publish this overlay's current state, throttled (trailing edge keeps the last
 * state of a burst) with a slower keepalive re-write. Fire-and-forget; never
 * throws. Call from the overlay window while sharing is enabled.
 */
export function publishOverlayShare(
  shareId: string,
  payload: OverlaySharePayload
): void {
  try {
    let s = shares.get(shareId);
    if (!s) {
      s = {
        latest: null,
        lastPublish: 0,
        trailing: null,
        keepalive: null,
      };
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

/** Stop sharing this overlay: clear timers and ask the background to remove the row. */
export function stopOverlayShare(shareId: string): void {
  const s = shares.get(shareId);
  if (s) {
    if (s.trailing) clearTimeout(s.trailing);
    if (s.keepalive) clearInterval(s.keepalive);
    shares.delete(shareId);
  }
  postChannelMessage({ type: "LIVE_SHARE_STOP", value: { shareId } });
}
