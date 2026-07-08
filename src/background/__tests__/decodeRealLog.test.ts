/* eslint-disable no-console */
import fs from "fs";
import path from "path";

import ArenaLogDecoder from "../arena-log-decoder/arena-log-decoder";

const LOG = path.resolve(__dirname, "../../../test-data/player.log");

// Requires a real log copied to test-data/player.log (gitignored). Skips in
// CI / clean checkouts where the fixture isn't present.
const maybeTest = fs.existsSync(LOG) ? test : test.skip;

maybeTest("decoder parses the real Player.log", () => {
  const text = fs.readFileSync(LOG, "utf8");
  console.log("LOG SIZE:", text.length);

  const decoder = ArenaLogDecoder();
  const entries: any[] = [];
  decoder.append(text, (e: any) => entries.push(e));

  const byLabel: Record<string, number> = {};
  for (const e of entries) {
    byLabel[e.label] = (byLabel[e.label] || 0) + 1;
  }

  console.log("TOTAL ENTRIES:", entries.length);
  console.log("BY LABEL:", JSON.stringify(byLabel, null, 2));

  const sample = (label: string) => {
    const e = entries.find((x) => x.label === label);
    console.log(
      `SAMPLE [${label}] arrow=${e?.arrow ?? "-"} json=`,
      e ? JSON.stringify(e.json).slice(0, 180) : "NOT FOUND"
    );
  };
  [
    "detailedLogs",
    "Client.SceneChange",
    "GraphGetGraphState",
    "AuthenticateResponse",
    "RankGetCombinedRankInfo",
    "StartHook",
    "GreToClientEvent",
    "MatchGameRoomStateChangedEvent",
  ].forEach(sample);

  expect(entries.length).toBeGreaterThan(0);
});
