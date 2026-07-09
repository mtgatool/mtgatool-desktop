/**
 * Log-reader mode state machine (source of truth lives in the background
 * window, where parsing happens; mirrored into redux for the UI).
 *
 *  - init:   startup catch-up. Read the whole current log 0→EOF to reach the
 *            current state. Save matches locally (idempotent) but suppress all
 *            live side effects — no overlay updates, no scene-driven memory
 *            reads, no per-match cloud push (the login reconcile pushes the
 *            backlog). Emit only progress + a few important messages.
 *  - tail:   live tailing. Trust the current MTGA user + memory; do everything.
 *  - reread: forced re-parse (UI button). Same suppression as init — re-scan
 *            the log for matches into local history, then reconcile to cloud —
 *            then return to tail. (Foreign-log persona-gating is a follow-up;
 *            re-reading the current log is the current user by definition.)
 */
export type LogMode = "init" | "tail" | "reread";

let mode: LogMode = "init";

export function setLogMode(next: LogMode): void {
  mode = next;
}

export function getLogMode(): LogMode {
  return mode;
}

/** True only while tailing live content (overlays, memory reads, cloud pushes). */
export function isLogLive(): boolean {
  return mode === "tail";
}

/** True during init or a forced re-read — live side effects are suppressed. */
export function isCatchingUp(): boolean {
  return mode !== "tail";
}
