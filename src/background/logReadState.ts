/**
 * Tracks whether the log watcher is tailing live content (true) or still
 * replaying the historical catch-up read at startup (false).
 *
 * During catch-up we replay potentially thousands of past game-state messages;
 * pushing an overlay update for each is pointless (no live match is on screen)
 * and floods the cross-window IPC. Live-only work checks `isLogLive()` and skips
 * while false.
 */
let live = false;

export function setLogLive(value: boolean): void {
  live = value;
}

export function isLogLive(): boolean {
  return live;
}
