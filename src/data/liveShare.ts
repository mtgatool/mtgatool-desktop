/**
 * Live overlay sharing (Supabase Realtime Broadcast).
 *
 * Replaces the tool-db "livematch-<id>" p2p publishing: while a match is live,
 * the background window broadcasts the overlay match state on one Realtime
 * channel per SHARING-ENABLED overlay ("overlay-<shareId>"). The public web
 * viewer (app.mtgatool.com/live/<shareId>) subscribes to the same channel and
 * renders it — no account needed, and nothing is written to the database
 * (broadcast is ephemeral pub/sub).
 *
 * The shareId is an unguessable per-overlay token stored in that overlay's
 * settings, so each overlay (main view, opponent view, draft...) has its own
 * shareable/revocable URL. Publishing is throttled and only happens while at
 * least one overlay has sharing enabled, so idle cost is zero.
 */
import { OverlayUpdateMatchState } from "../background/store/types";
import { OverlaySettingsData } from "../types/settings";
import getLocalSetting from "../utils/getLocalSetting";
import supabase from "./supabase";

interface ShareTarget {
  overlayId: number;
  shareId: string;
  settings: OverlaySettingsData;
}

interface LiveChannel {
  channel: ReturnType<typeof supabase.channel>;
  joined: boolean;
}

const channels = new Map<string, LiveChannel>();

const THROTTLE_MS = 1000;
let lastPublish = 0;
let trailing: ReturnType<typeof setTimeout> | null = null;
let latestState: OverlayUpdateMatchState | null = null;

/** Overlays currently sharing, straight from the persisted settings. */
function shareTargets(): ShareTarget[] {
  try {
    const settings = JSON.parse(getLocalSetting("settings"));
    const overlays: OverlaySettingsData[] = settings?.overlays || [];
    return overlays
      .map((o, i) => ({ overlayId: i, shareId: o.shareId || "", settings: o }))
      .filter((t) => t.shareId && t.settings.shareEnabled);
  } catch {
    return [];
  }
}

function getChannel(shareId: string): LiveChannel {
  let live = channels.get(shareId);
  if (!live) {
    // ack:true so send() resolves only when the server confirms delivery — we
    // use that signal to detect a rotted Realtime connection and recreate the
    // channel. At ~1 msg/sec the extra round-trip is negligible.
    const channel = supabase.channel(`overlay-${shareId}`, {
      config: { broadcast: { ack: true } },
    });
    live = { channel, joined: false };
    const ref = live;
    channel.subscribe((status) => {
      ref.joined = status === "SUBSCRIBED";
      // A dropped/errored channel would otherwise stay dead forever (sends are
      // skipped while not joined). Drop it from the map so the next publish
      // tick recreates and rejoins it.
      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        // eslint-disable-next-line no-console
        console.warn(`[liveShare] channel overlay-${shareId} ${status}`);
        supabase.removeChannel(channel);
        if (channels.get(shareId) === ref) channels.delete(shareId);
      }
    });
    channels.set(shareId, live);
  }
  return live;
}

/** Leave channels whose overlay stopped sharing. */
function pruneChannels(active: Set<string>): void {
  channels.forEach((live, shareId) => {
    if (!active.has(shareId)) {
      supabase.removeChannel(live.channel);
      channels.delete(shareId);
    }
  });
}

let publishSeq = 0;

function doPublish(): void {
  const state = latestState;
  if (!state) return;

  const targets = shareTargets();
  pruneChannels(new Set(targets.map((t) => t.shareId)));
  if (targets.length === 0) return;

  publishSeq += 1;
  const seq = publishSeq;
  // eslint-disable-next-line no-console
  console.log(
    `[liveShare] publish #${seq} -> ${targets
      .map((t) => `${t.shareId.slice(0, 8)}(${channels.get(t.shareId)?.joined ? "joined" : "connecting"})`)
      .join(", ")}`
  );

  targets.forEach((target) => {
    const live = getChannel(target.shareId);
    if (!live.joined) return; // still connecting; next tick will catch up
    live.channel
      .send({
        type: "broadcast",
        event: "overlay",
        payload: {
          matchState: state,
          settings: target.settings,
          overlayId: target.overlayId,
          ts: new Date().getTime(),
        },
      })
      .then((res) => {
        // send() resolves "ok" only when the socket accepted it; anything else
        // means the Realtime connection is unhealthy — recreate the channel so
        // the next tick rejoins instead of publishing into the void.
        if (res !== "ok") {
          // eslint-disable-next-line no-console
          console.warn(
            `[liveShare] send #${seq} overlay-${target.shareId} -> ${res}; recreating`
          );
          supabase.removeChannel(live.channel);
          if (channels.get(target.shareId) === live) {
            channels.delete(target.shareId);
          }
        }
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn(`[liveShare] send #${seq} overlay-${target.shareId} failed`, e);
      });
  });
}

// Re-push the latest state on a fixed cadence, independent of match updates.
// This (a) keeps the Realtime socket warm, (b) lets a late-joining viewer get
// current state without waiting for the next in-game change, and (c) recovers
// automatically if a send ever tore a channel down — the next tick rejoins and
// resends. Only runs while there's state to share.
const KEEPALIVE_MS = 3000;
let keepalive: ReturnType<typeof setInterval> | null = null;

function ensureKeepalive(): void {
  if (keepalive) return;
  keepalive = setInterval(() => {
    if (latestState) doPublish();
  }, KEEPALIVE_MS);
}

/**
 * Publish the current overlay match state to every sharing-enabled overlay
 * channel, throttled (trailing edge keeps the last state of a burst).
 * Fire-and-forget and never throws — called inline from updateDeck.
 */
export default function publishLiveShare(
  matchState: OverlayUpdateMatchState
): void {
  try {
    latestState = matchState;
    ensureKeepalive();

    const now = new Date().getTime();
    if (now - lastPublish >= THROTTLE_MS) {
      lastPublish = now;
      doPublish();
    } else if (!trailing) {
      trailing = setTimeout(() => {
        trailing = null;
        lastPublish = new Date().getTime();
        doPublish();
      }, THROTTLE_MS - (now - lastPublish));
    }
  } catch (e) {
    console.error("publishLiveShare failed:", e);
  }
}
