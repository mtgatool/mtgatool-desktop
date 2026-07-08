/**
 * Tiny in-memory debug event buffer, surfaced by the DebugPanel overlay so
 * pipeline activity (channel messages reaching the UI, memory reads, log
 * watcher status) can be inspected without opening devtools.
 */

export interface DebugEntry {
  time: number;
  msg: string;
}

const MAX = 300;
const buffer: DebugEntry[] = [];
const listeners = new Set<() => void>();

export function pushDebug(msg: string): void {
  buffer.push({ time: Date.now(), msg });
  if (buffer.length > MAX) buffer.shift();
  // Also mirror to the console so devtools / an attached inspector sees it.
  // eslint-disable-next-line no-console
  console.log("[mtgatool]", msg);
  listeners.forEach((l) => l());
}

export function getDebug(): DebugEntry[] {
  return buffer;
}

export function clearDebug(): void {
  buffer.length = 0;
  listeners.forEach((l) => l());
}

export function subscribeDebug(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
