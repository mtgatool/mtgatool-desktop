/* eslint-disable no-console */
import fs from "fs";
import path from "path";

import ArenaLogDecoder from "../arena-log-decoder/arena-log-decoder";

const handlerCalls: { handler: string; label: string; arrow?: string }[] = [];
const channelMsgs: any[] = [];

// Record which onLabel handler fires for each entry, without running the
// real handler bodies (which touch redux / memory / Tauri).
jest.mock(
  "../onLabel",
  () =>
    new Proxy(
      {},
      {
        get: (_t, name: string) => (entry: any) => {
          handlerCalls.push({
            handler: String(name),
            label: entry?.label,
            arrow: entry?.arrow,
          });
        },
      }
    )
);

// Capture channel messages (e.g. DAEMON_GET_PLAYER_ID from GraphGetGraphState).
jest.mock("../../broadcastChannel/postChannelMessage", () => ({
  __esModule: true,
  default: (msg: any) => {
    channelMsgs.push(msg);
  },
}));

// eslint-disable-next-line import/first, @typescript-eslint/no-var-requires
import logEntrySwitch from "../logEntrySwitch";

const LOG = path.resolve(__dirname, "../../../test-data/player.log");
// Skips when the local fixture isn't present (gitignored).
const maybeTest = fs.existsSync(LOG) ? test : test.skip;

maybeTest("real log routes to the expected handlers", () => {
  const text = fs.readFileSync(LOG, "utf8");

  const decoder = ArenaLogDecoder();
  const entries: any[] = [];
  decoder.append(text, (e: any) => entries.push(e));
  entries.forEach((e) => logEntrySwitch(e));

  const byHandler: Record<string, number> = {};
  handlerCalls.forEach((c) => {
    byHandler[c.handler] = (byHandler[c.handler] || 0) + 1;
  });
  const byMsg: Record<string, number> = {};
  channelMsgs.forEach((m) => {
    byMsg[m.type] = (byMsg[m.type] || 0) + 1;
  });

  console.log("ENTRIES:", entries.length);
  console.log("HANDLER CALLS:", JSON.stringify(byHandler, null, 2));
  console.log("CHANNEL MESSAGES:", JSON.stringify(byMsg, null, 2));

  // The account is picked up via GraphGetGraphState -> DAEMON_GET_PLAYER_ID.
  expect(channelMsgs.some((m) => m.type === "DAEMON_GET_PLAYER_ID")).toBe(true);
  // Match stream is routed.
  expect(handlerCalls.some((c) => c.handler === "GreToClient")).toBe(true);
});
