/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import fs, { Stats } from "fs";
import { promisify } from "util";
import { StringDecoder } from "string_decoder";
import queue from "queue";
import ArenaLogDecoder from "./arena-log-decoder/arena-log-decoder";

const skipFirstpass = false;

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
    } catch (err) {
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
}: StartProps): () => void {
  const q = queue({ concurrency: 1 });
  let position = 0;
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
    while (position < size) {
      if (!skipFirstpass) {
        // eslint-disable-next-line no-await-in-loop
        const buffer = await readChunk(
          path,
          position,
          Math.min(size - position, chunkSize)
        );
        const text = stringDecoder.write(buffer);
        logDecoder.append(text, (entry: any) => onLogEntry({ ...entry, size }));
        // eslint-disable-next-line require-atomic-updates
        position += buffer.length;
      } else {
        position = size;
      }
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
