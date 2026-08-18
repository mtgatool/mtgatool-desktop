/* eslint-disable no-console */
/**
 * Targeted log capture, configured from the admin panel.
 *
 * Some parsing bugs only occur in situations we cannot reproduce locally — a
 * direct challenge you did not start, an event that ran for two days. When one
 * turns up, admin names the log label it needs and a handful of clients send
 * that entry the next time they see it.
 *
 * The rules that keep this small, and honest:
 *
 * - Only labels admin explicitly asked for. Never "everything".
 * - The list is fetched **at login**, so a capture added today reaches people
 *   as they sign in over the following day rather than mid-session.
 * - A client sends **one entry per capture, once**, then forgets that capture
 *   for the rest of the session.
 * - The server enforces the real limits (one row per user, and a cap across
 *   the whole system), so a client cannot overshoot by racing.
 *
 * The two halves run in different windows. Fetching and uploading happen in
 * the main window, which owns the Supabase session; matching happens in the
 * background window, where the log is parsed. They meet over the broadcast
 * channel, which is why the config is handed across rather than read twice.
 */
import postChannelMessage from "../broadcastChannel/postChannelMessage";
import supabase from "./supabase";

export interface LogCapture {
  id: string;
  labels: string[];
}

/* ------------------------------------------------ background (parser) side */

/** Captures still worth watching in this window, for this session. */
let active: LogCapture[] = [];
let wanted = new Set<string>();

function reindex(): void {
  wanted = new Set(active.flatMap((capture) => capture.labels));
}

/** Apply a config handed over from the main window. */
export function setActiveCaptures(captures: LogCapture[]): void {
  active = (captures || []).filter((capture) => capture.labels?.length);
  reindex();
  if (active.length) {
    console.log(
      `[log-capture] watching ${wanted.size} label(s) for ${active.length} capture(s)`
    );
  }
}

/**
 * Whether any active capture wants this label.
 *
 * Called for every log entry, so it stays a Set lookup against a set that is
 * empty unless a capture is running.
 */
export function isLabelWanted(label: string): boolean {
  return wanted.size > 0 && wanted.has(label);
}

/**
 * Claim the captures asking for this label, removing them as it goes.
 *
 * Claiming and forgetting in one step is what makes "one entry per capture per
 * session" true without a round trip: by the time the entry is on its way, no
 * later entry can match the same capture again.
 */
export function claimCapturesFor(label: string): string[] {
  const ids = active
    .filter((capture) => capture.labels.includes(label))
    .map((capture) => capture.id);
  if (ids.length) {
    active = active.filter((capture) => !ids.includes(capture.id));
    reindex();
  }
  return ids;
}

/* ------------------------------------------------------- main window side */

/**
 * Fetch the active captures and hand them to the parser.
 *
 * Best-effort in every direction: a failure means capture nothing, which is
 * also the default. Called once per login.
 */
export async function loadLogCaptures(): Promise<void> {
  try {
    const { data, error } = await (supabase as any)
      .from("log_captures")
      .select("id, labels")
      .eq("active", true);

    if (error || !data?.length) return;

    postChannelMessage({
      type: "LOG_CAPTURE_CONFIG",
      value: data as LogCapture[],
    });
  } catch (e) {
    // Nothing to do: no config means no capture.
  }
}

/** Upload one captured entry to each capture that claimed it. */
export async function submitLogCapture(value: {
  captureIds: string[];
  label: string;
  hash?: string;
  timestamp?: string;
  arrow?: string;
  type?: string;
  jsonString?: string;
  size?: number;
  position?: number;
}): Promise<void> {
  await Promise.all(
    (value.captureIds || []).map(async (captureId) => {
      try {
        const { error } = await (supabase as any).rpc("submit_log_capture", {
          p_capture_id: captureId,
          p_label: value.label,
          p_hash: value.hash ?? null,
          p_timestamp: value.timestamp ?? null,
          p_arrow: value.arrow ?? null,
          p_type: value.type ?? null,
          p_json_string: value.jsonString ?? null,
          p_size: value.size ?? null,
          p_position: value.position ?? null,
        });
        if (!error) console.log(`[log-capture] sent ${value.label}`);
      } catch (e) {
        // Opportunistic debugging data is never worth a retry loop.
      }
    })
  );
}
