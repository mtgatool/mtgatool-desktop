/**
 * Where to start reading when the tracker opens during a match.
 *
 * Normally startup seeks to the end of the log: matches already played are in
 * the database, and there is nothing to gain from replaying them. Open the
 * tracker while a game is running, though, and that lands the parser in the
 * middle of a match it never saw begin — the first thing it fully understands
 * is the result, and the match is saved with no decklists, no seats and a
 * scoreline of 0-0.
 *
 * The fix is only ever *where the reader starts*. Handed the log from the right
 * offset, the parser sees an ordinary match from its beginning and behaves as
 * if the tracker had been open all along; nothing about it changes.
 *
 * Finding that offset does not need the parser, or even the decoder — just two
 * strings, which is a plain text scan of the file before reading begins.
 */
import fs from "fs";

const PLAYING = '"stateType": "MatchGameRoomStateType_Playing"';
const COMPLETED = '"stateType": "MatchGameRoomStateType_MatchCompleted"';

/**
 * The byte to start reading from, or null to start at the end as usual.
 *
 * Returns an offset only when a match is genuinely underway: a start marker
 * with no completion after it.
 */
export default function findInProgressMatch(path: fs.PathLike): number | null {
  let text: string;
  try {
    text = fs.readFileSync(path, "utf8");
  } catch (e) {
    return null;
  }

  const start = text.lastIndexOf(PLAYING);
  if (start === -1) return null;
  // A completion after the last start means the match is over and there is
  // nothing in progress to recover.
  if (text.indexOf(COMPLETED, start) !== -1) return null;

  // Deliberately *before* the match starts, not at it. Two things live in the
  // gap and both are needed:
  //
  //  - the deck submission, which is what gives the match its decklists. It
  //    comes before the room announces itself.
  //  - the entry's own label line. Every entry is a `[UnityCrossThreadLogger]`
  //    line followed by its JSON, and the decoder identifies entries by that
  //    label; open the window on the JSON and the match start is not merely
  //    mis-read but invisible, which leaves the player and opponent seats at 0.
  //
  // The previous match's completion is the natural boundary: everything after
  // it belongs to the match now being played, and its own result stays outside
  // the window where it cannot be recorded a second time.
  const previous = text.lastIndexOf(COMPLETED, start);
  if (previous === -1) {
    // Nothing finished earlier, so the log holds only this match. Reading it
    // whole replays exactly one match.
    return 0;
  }

  const nextLine = text.indexOf("\n", previous);
  if (nextLine === -1) return null;

  // Byte offset, not character offset: the reader seeks in bytes, and the log
  // is not all ASCII — card names carry accents, and counting characters would
  // put the window a few bytes adrift and cost the first entry in it.
  return Buffer.byteLength(text.slice(0, nextLine + 1), "utf8");
}
