/**
 * Live overlay sharing via HTTP upsert/poll (no realtime socket).
 *
 * Each sharing-enabled overlay WINDOW upserts its current state into the
 * `live_overlays` table keyed by shareId; the public web viewer
 * (app.mtgatool.com/live/<shareId>) polls that row and renders it. This is a
 * plain REST PUT/GET — stateless, so it survives the aggressive renderer
 * suspension our always-on-top overlay windows get from Chromium (a suspended
 * window just resumes on its next timer tick) with none of the WebSocket
 * heartbeat/reconnect fragility.
 *
 * RLS: authenticated desktop users write only their own rows (user_id defaults
 * to auth.uid()); anyone may read (the shareId is an unguessable capability).
 */
import { OverlaySettings } from "../common/defaultConfig";
import supabase from "./supabase";

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
  inflight: boolean;
}

// Publish cadence. Throttle collapses a burst of match updates to one write per
// second; the keepalive re-writes on a slower beat so a late-joining viewer
// still converges even if nothing changed.
const THROTTLE_MS = 1000;
const KEEPALIVE_MS = 3000;

const shares = new Map<string, PerShare>();

function upsertNow(shareId: string): void {
  const s = shares.get(shareId);
  if (!s || !s.latest || s.inflight) return;
  s.inflight = true;
  supabase
    .from("live_overlays")
    .upsert(
      {
        share_id: shareId,
        payload: s.latest as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "share_id" }
    )
    .then(({ error }) => {
      const cur = shares.get(shareId);
      if (cur) cur.inflight = false;
      if (error) {
        // eslint-disable-next-line no-console
        console.warn(`[liveShare] upsert ${shareId} failed:`, error.message);
      }
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
        inflight: false,
      };
      shares.set(shareId, s);
    }
    s.latest = payload;
    if (!s.keepalive) {
      s.keepalive = setInterval(() => upsertNow(shareId), KEEPALIVE_MS);
    }

    const now = new Date().getTime();
    if (now - s.lastPublish >= THROTTLE_MS) {
      s.lastPublish = now;
      upsertNow(shareId);
    } else if (!s.trailing) {
      const wait = THROTTLE_MS - (now - s.lastPublish);
      s.trailing = setTimeout(() => {
        const cur = shares.get(shareId);
        if (cur) {
          cur.trailing = null;
          cur.lastPublish = new Date().getTime();
        }
        upsertNow(shareId);
      }, wait);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("publishOverlayShare failed:", e);
  }
}

/** Stop sharing this overlay: clear timers and remove the row. */
export function stopOverlayShare(shareId: string): void {
  const s = shares.get(shareId);
  if (s) {
    if (s.trailing) clearTimeout(s.trailing);
    if (s.keepalive) clearInterval(s.keepalive);
    shares.delete(shareId);
  }
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
