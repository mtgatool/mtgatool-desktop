import fs from "fs";
import os from "os";
import path from "path";

import findInProgressMatch from "../findInProgressMatch";

/**
 * The scan reads two markers out of the raw text. It runs before the decoder
 * and the parser, which is the whole point: knowing whether a match is underway
 * cannot depend on having parsed the log we are deciding where to start
 * reading.
 */
const PLAYING =
  "[UnityCrossThreadLogger]==> MatchGameRoomStateChangedEvent\n" +
  '{ "matchGameRoomStateChangedEvent": { "gameRoomInfo": { "stateType": "MatchGameRoomStateType_Playing" } } }\n';
const COMPLETED =
  "[UnityCrossThreadLogger]==> MatchGameRoomStateChangedEvent\n" +
  '{ "matchGameRoomStateChangedEvent": { "gameRoomInfo": { "stateType": "MatchGameRoomStateType_MatchCompleted" } } }\n';
const DECK = '[UnityCrossThreadLogger]==> EventSetDeckV3\n{ "deck": "..." }\n';
const NOISE = "GreClient.Network.GREConnection:ProcessMessages()\n";

function write(contents: string): string {
  const file = path.join(os.tmpdir(), `mtgatool-scan-${contents.length}.log`);
  fs.writeFileSync(file, contents);
  return file;
}

describe("findInProgressMatch", () => {
  it("starts at the end when the last match finished", () => {
    expect(
      findInProgressMatch(write(NOISE + PLAYING + NOISE + COMPLETED + NOISE))
    ).toBeNull();
  });

  it("starts at the end when no match was ever played", () => {
    expect(findInProgressMatch(write(NOISE + DECK + NOISE))).toBeNull();
  });

  it("rewinds past the previous match when one is being played", () => {
    const before = NOISE + PLAYING + NOISE + COMPLETED;
    const contents = before + NOISE + DECK + PLAYING + NOISE;
    const at = findInProgressMatch(write(contents));

    // Just after the previous match's completion: its result stays outside the
    // window, and the deck submission that follows it stays inside.
    expect(at).toBe(Buffer.byteLength(before, "utf8"));
    expect(contents.slice(at as number)).toContain("EventSetDeckV3");
    expect(contents.slice(at as number)).not.toContain(
      "MatchGameRoomStateType_MatchCompleted"
    );
  });

  it("reads from the top when the match being played is the first one", () => {
    // Nothing finished earlier, so the whole log is this one match.
    expect(findInProgressMatch(write(NOISE + DECK + PLAYING + NOISE))).toBe(0);
  });

  it("counts bytes rather than characters", () => {
    // Card names carry accents. Counting characters would leave the window a
    // few bytes short and swallow the entry it was aimed at.
    const before = `${PLAYING}{ "name": "Jaya Ballard, Task Mage — Æther" }\n${COMPLETED}`;
    const contents = before + DECK + PLAYING;
    const at = findInProgressMatch(write(contents));

    expect(at).toBe(Buffer.byteLength(before, "utf8"));
    expect(at).toBeGreaterThan(before.length);
  });

  it("says nothing rather than throwing when the log cannot be read", () => {
    expect(findInProgressMatch("/nope/not/here.log")).toBeNull();
  });
});
