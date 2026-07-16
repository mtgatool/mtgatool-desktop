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
    const channel = supabase.channel(`overlay-${shareId}`, {
      config: { broadcast: { ack: false } },
    });
    live = { channel, joined: false };
    const ref = live;
    channel.subscribe((status) => {
      ref.joined = status === "SUBSCRIBED";
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

function doPublish(): void {
  const state = latestState;
  if (!state) return;

  const targets = shareTargets();
  pruneChannels(new Set(targets.map((t) => t.shareId)));
  if (targets.length === 0) return;

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
      .catch(() => undefined);
  });
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
