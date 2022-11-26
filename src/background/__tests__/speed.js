import path from "path";

import arenaLogWatcher from "../arena-log-watcher";
import logEntrySwitch from "../logEntrySwitch";

// const originalLog = console.error
// const originalWarn = console.warn
jest.setTimeout(20000);

beforeEach(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
});

function tryParseOnce() {
  return new Promise((resolve) => {
    const startTime = new Date().getTime();
    arenaLogWatcher.start({
      path: path.join(__dirname, "test.log"),
      chunkSize: 268435440,
      onLogEntry: logEntrySwitch,
      onError: console.error,
      onFinish: () => {
        const endTime = new Date().getTime();
        resolve(endTime - startTime);
      },
    });
  });
}

it("Can parse logs fast", async () => {
  const parsedA = await tryParseOnce();

  expect(parsedA).toBeLessThanOrEqual(15000);
});
