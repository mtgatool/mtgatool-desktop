/**
 * Tracks whether the log reader has finished its initial catch-up pass and is
 * now tailing the log live.
 *
 * The log worker runs on the renderer main thread, and several label handlers
 * do *synchronous* native memory reads (readCards / readDecks / readRank).
 * During the startup catch-up the reader replays the entire Player.log, so
 * those handlers fire dozens of times and freeze the UI — and the reads are
 * pointless anyway, because they read the CURRENT game memory, not the state at
 * the time of a historical log entry. Gate every such read behind `isLiveLog()`
 * so it only runs while tailing live, after catch-up completes.
 */
let live = false;

export function isLiveLog(): boolean {
  return live;
}

export function setLiveLog(value: boolean): void {
  live = value;
}
