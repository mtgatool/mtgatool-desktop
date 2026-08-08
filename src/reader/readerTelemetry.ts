/**
 * Timings for the memory reads, so the settings page can show what the reader
 * is actually doing.
 *
 * Until now the only thing on screen was a status dot: green if a probe
 * succeeded a second ago, red otherwise. That answers "is it working" and
 * nothing else — not what was read, how long it took, or whether one particular
 * read has started failing while the rest are fine. Which is exactly what you
 * want to know when someone reports the tracker missing their decks.
 *
 * The reads happen in the background window and the settings page lives in the
 * main one, so each is posted across as it completes. They are small and not
 * especially frequent — a handful on scene changes, a few per match — so this
 * costs a message each rather than a poll.
 */
import postChannelMessage from "../broadcastChannel/postChannelMessage";

export type ReadKind = "memory" | "log";

export interface ReaderRead {
  /**
   * Where it came from. Memory reads are the handful of typed readers; log
   * reads are the watcher draining Player.log, which happens far more often
   * and is what makes the view move while a game is on.
   */
  kind: ReadKind;
  /** The reader function, as a user would recognise it: "readDecks". */
  name: string;
  /** Wall-clock duration in milliseconds. */
  ms: number;
  ok: boolean;
  /** When it finished. */
  at: number;
  /** Present when it failed, trimmed to something displayable. */
  error?: string;
  /** How much the read yielded — log entries parsed, for instance. */
  count?: number;
}

function reportRead(read: ReaderRead): void {
  try {
    postChannelMessage({ type: "READER_READ", value: read });
  } catch (e) {
    // Telemetry must never be the reason a read fails.
  }
}

/**
 * Time a memory read and report it.
 *
 * Wraps rather than replaces the call, so a reader keeps its own error
 * handling: a read that fails is still recorded and still throws onward
 * exactly as it did before.
 */
export default async function timed<T>(
  name: string,
  read: () => Promise<T>
): Promise<T> {
  const started = Date.now();
  try {
    const result = await read();
    reportRead({
      kind: "memory",
      name,
      ms: Date.now() - started,
      ok: true,
      at: Date.now(),
    });
    return result;
  } catch (e) {
    reportRead({
      kind: "memory",
      name,
      ms: Date.now() - started,
      ok: false,
      at: Date.now(),
      error: String(e).slice(0, 120),
    });
    throw e;
  }
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/**
 * Report a log read. The watcher is synchronous and already knows what it did,
 * so it hands the numbers over rather than being wrapped.
 */
export function reportLogRead(
  ms: number,
  bytes: number,
  entries: number
): void {
  // A chunk that completes no entries is still a real read — the log grew but
  // its last line is half-written, which happens constantly while a game is on.
  // Naming it by size says something true; "0 log entries" reads like a failure
  // when it is the ordinary case.
  let name: string;
  if (entries === 0) {
    name = `${formatBytes(bytes)} read`;
  } else if (entries === 1) {
    name = "1 log entry";
  } else {
    name = `${entries} log entries`;
  }

  reportRead({ kind: "log", name, ms, ok: true, at: Date.now(), count: bytes });
}
