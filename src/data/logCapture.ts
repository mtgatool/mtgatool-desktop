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
 *
 * THIS module is the parser half, and it deliberately imports nothing — no
 * Supabase client, no channel. Importing the client here would construct a
 * second auth client in the background window against the same stored
 * session, which is a token-refresh race nobody asked for, on the window that
 * must never stall. The uploading half lives in `logCaptureSync`.
 */
export interface LogCapture {
  id: string;
  labels: string[];
  /**
   * Which direction of the label to take: `==>`, `<==`, or both when empty.
   *
   * Request/response labels appear twice and a capture is claimed by the FIRST
   * match, which is always the outbound request — usually an empty envelope,
   * while the response is the thing worth reading.
   */
  arrows?: string[] | null;
}

/** Captures still worth watching in this window, for this session. */
let active: LogCapture[] = [];
let wanted = new Set<string>();

function reindex(): void {
  wanted = new Set(active.flatMap((capture) => capture.labels));
}

/** Whether a capture wants this entry, label and direction both. */
function matches(
  capture: LogCapture,
  label: string,
  arrow?: string
): boolean {
  if (!capture.labels.includes(label)) return false;
  // No direction asked for: either will do, including entries that have none.
  if (!capture.arrows?.length) return true;
  return !!arrow && capture.arrows.includes(arrow);
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

/** Whether any capture wants this entry once direction is taken into account. */
export function isEntryWanted(label: string, arrow?: string): boolean {
  if (!isLabelWanted(label)) return false;
  return active.some((capture) => matches(capture, label, arrow));
}

/**
 * Claim the captures asking for this label, removing them as it goes.
 *
 * Claiming and forgetting in one step is what makes "one entry per capture per
 * session" true without a round trip: by the time the entry is on its way, no
 * later entry can match the same capture again.
 */
export function claimCapturesFor(label: string, arrow?: string): string[] {
  const ids = active
    .filter((capture) => matches(capture, label, arrow))
    .map((capture) => capture.id);
  if (ids.length) {
    active = active.filter((capture) => !ids.includes(capture.id));
    reindex();
  }
  return ids;
}
