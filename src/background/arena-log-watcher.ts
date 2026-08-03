/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import fs, { Stats } from "fs";
import queue from "queue";
import { StringDecoder } from "string_decoder";
import { promisify } from "util";

import postChannelMessage from "../broadcastChannel/postChannelMessage";
import ArenaLogDecoder from "./arena-log-decoder/arena-log-decoder";

const fsAsync = {
  close: promisify(fs.close),
  open: promisify(fs.open),
  read: promisify(fs.read),
  stat: promisify(fs.stat),
};

interface StartProps {
  path: fs.PathLike;
  chunkSize: number;
  onLogEntry: (entry: any) => void;
  onError: (err: any) => void;
  onFinish: () => void;
  // Forward-only mode: on the very first pass, seek to the current end of the
  // log without replaying its history (matches already live in the DB / cloud).
  // Live entries appended afterwards are still processed normally.
  skipInitialBackfill?: boolean;
}

async function readChunk(
  path: fs.PathLike,
  position: number,
  length: number
): Promise<Buffer> {
  const buffer = Buffer.alloc(length);
  const fd = await fsAsync.open(path, "r");
  try {
    await fsAsync.read(fd, buffer, 0, length, position);
  } finally {
    await fsAsync.close(fd);
  }
  return buffer;
}

function fsWatch(
  path: fs.PathLike,
  onChanged: () => void,
  interval: number
): () => void {
  let lastSize: number;
  let handle: NodeJS.Timeout;
  start();
  return stop;

  async function attemptSize(): Promise<Stats["size"]> {
    try {
      const stats = await fsAsync.stat(path);
      return stats.size;
    } catch (err: any) {
      if (err.code === "ENOENT") return 0;
      throw err;
    }
  }

  // eslint-disable-next-line no-shadow
  async function start(): Promise<void> {
    lastSize = await attemptSize();
    handle = global.setInterval(checkFile, interval);
  }

  async function checkFile(): Promise<void> {
    postChannelMessage({
      type: "LOG_CHECK",
    });
    const size = await attemptSize();
    if (lastSize === size) return;
    lastSize = size;
    onChanged();
  }

  function stop(): void {
    if (handle) clearInterval(handle);
  }
}

function start({
  path,
  chunkSize,
  onLogEntry,
  onError,
  onFinish,
  skipInitialBackfill = false,
}: StartProps): () => void {
  const q = queue({ concurrency: 1 });
  let position = 0;
  let firstPass = true;
  let stringDecoder = new StringDecoder();
  let logDecoder = ArenaLogDecoder();

  const stopWatching = fsWatch(path, schedule, 250);

  function stop(): void {
    stopWatching();
    q.end();
  }

  async function read(): Promise<void> {
    const { size } = await fsAsync.stat(path);
    if (position > size) {
      // the file has been recreated, we must reset our state
      stringDecoder = new StringDecoder();
      logDecoder = ArenaLogDecoder();
      position = 0;
    }

    // Forward-only default: don't replay the whole log on startup. Seek to the
    // current end and only process entries appended from here. Applies to the
    // first pass only — a mid-session log rotation (handled above) still reads
    // the fresh file normally.
    if (firstPass && skipInitialBackfill) {
      firstPass = false;
      position = size;
      onFinish();
      return;
    }
    firstPass = false;

    while (position < size) {
      // eslint-disable-next-line no-await-in-loop
      const buffer = await readChunk(
        path,
        position,
        Math.min(size - position, chunkSize)
      );
      const text = stringDecoder.write(buffer);
      // One bad entry must not stop the reader. A handler that throws would
      // otherwise escape the loop before `position` advances, so the next pass
      // re-reads the same chunk and throws again — the log is never read past
      // that byte, and every match after it is silently missed. Arena changes
      // its payload shapes without warning, so this has to be per-entry.
      logDecoder.append(text, (entry: any) => {
        try {
          onLogEntry({ ...entry, size });
        } catch (e) {
          console.error(`[log] handler failed for "${entry?.label}":`, e);
        }
      });
      // eslint-disable-next-line require-atomic-updates
      position += buffer.length;
    }
    onFinish();
  }

  async function attempt(): Promise<void> {
    try {
      await read();
    } catch (err) {
      onError(err);
    }
  }

  function schedule(): void {
    q.push(attempt);
    q.start();
  }

  schedule();
  return stop;
}

export default { start };
