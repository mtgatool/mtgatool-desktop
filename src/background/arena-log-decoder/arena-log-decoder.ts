/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable consistent-return */

/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-var-requires */
import _ from "lodash";

import sha1 from "../../utils/sha1";
import * as jsonText from "./jsonText";
import nthLastIndexOf from "./nthLastIndexOf";

function occurrences(text: string, re: RegExp): number {
  const matches = text.match(re);
  return matches ? matches.length : 0;
}

const DETAILED_LOGS_PATTERN = /DETAILED LOGS: (?<mode>.*)(?:\r\n|\n)/;

const LABEL_JSON_PATTERNS = [
  /\[UnityCrossThreadLogger\](?<timestamp>.*): (?:Match to )?(?<playerId>\w*)(?: to Match)?: (?<label>.*)(?:\r\n|\n)/,
  /\[UnityCrossThreadLogger\](?<label>.*) /,
  /\[UnityCrossThreadLogger\]Received unhandled GREMessageType: (?<label>.*)(?:\r\n|\n)*/,
];

const LABEL_ARROW_JSON_PATTERN =
  /\[UnityCrossThreadLogger\](?<arrow>[<=]=[=>]) (?<label>.*?) /;

const LABEL_ARROW_JSON_PATTERN_NEW =
  /(?<arrow>[<=]=[=>]) (?<label>.*?)\(.*-+.*\)(?:\r\n|\n)/;

const ALL_PATTERNS = [
  LABEL_ARROW_JSON_PATTERN,
  LABEL_ARROW_JSON_PATTERN_NEW,
  DETAILED_LOGS_PATTERN,
  ...LABEL_JSON_PATTERNS,
];

const maxLinesOfAnyPattern = Math.max(
  ...ALL_PATTERNS.map((regex) => occurrences(regex.source, /\\n/g))
);

const logEntryPattern = new RegExp(
  `(${ALL_PATTERNS.map((re) => re.source.replace(/\(\?<\w*>/g, "(")).join(
    "|"
  )})`,
  "g"
);

// V8 caps strings at ~512 MB; concatenating beyond that throws "Invalid string
// length". The decoder keeps un-parsed bytes in `buffer` between chunks, so an
// entry that never completes (a perpetual "partial" at the buffer start, e.g. a
// giant/corrupt GameStateMessage or an oversized line with no newline) would
// grow the buffer without bound until it crashes the whole log reader. Cap it
// well below the engine limit and resync at a line boundary when exceeded.
const MAX_BUFFER_SIZE = 128 * 1024 * 1024;

function unleakString(s: string): string {
  return ` ${s}`.substr(1);
}

// The global RegExp object has a lastMatch property that holds references to
// strings -- even our very large ones. This fn can be called to release those.
function unleakRegExp(): void {
  /\s*/g.exec("");
}

function tryDecodeJson(jsonString: string) {
  if (
    jsonString ===
    "[Message summarized because one or more GameStateMessages exceeded the 50 GameObject or 50 Annotation limit.]"
  ) {
    return {};
  }
  let json: any = {};
  try {
    // console.log(jsonString, jsonStart, jsonLen);
    json = JSON.parse(jsonString);
  } catch (e) {
    console.error(e);
    console.info(jsonString);
  }
  return json.payload || (json.request && JSON.parse(json.request)) || json;
}

function parseLogEntry(
  text: string,
  matchText: string,
  position: number,
  absPosition: number
): any[] {
  let rematches: RegExpMatchArray | null;
  // console.log("parseLogEntry", text, matchText);
  if (
    (rematches = matchText.match(LABEL_ARROW_JSON_PATTERN)) ||
    (rematches = matchText.match(LABEL_ARROW_JSON_PATTERN_NEW))
  ) {
    const jsonStart = position + matchText.length;
    if (jsonStart >= text.length) {
      return ["partial"];
    }
    if (!jsonText.starts(text, jsonStart)) {
      return ["invalid", matchText.length];
    }

    const jsonLen = jsonText.length(text, jsonStart);
    if (jsonLen === -1) {
      return ["partial"];
    }

    let textAfterJson = text.substr(jsonStart + jsonLen, 2);
    if (textAfterJson !== "\r\n") {
      textAfterJson = text.substr(jsonStart + jsonLen, 1);
      if (textAfterJson !== "\n") {
        return ["partial"];
      }
    }

    const jsonString = text.substr(jsonStart, jsonLen);
    return [
      "full",
      matchText.length + jsonLen + textAfterJson.length,
      {
        type: "label_arrow_json",
        ..._.mapValues(rematches.groups, unleakString),
        hash: sha1(jsonString + absPosition),
        json: tryDecodeJson(jsonString),
      },
    ];
  }

  if ((rematches = matchText.match(DETAILED_LOGS_PATTERN))) {
    return [
      "full",
      text.length,
      { label: "detailedLogs", json: rematches.groups?.mode },
    ];
  }

  for (const pattern of LABEL_JSON_PATTERNS) {
    rematches = matchText.match(pattern);
    // eslint-disable-next-line no-continue
    if (!rematches) continue;

    const jsonStart = position + matchText.length;
    if (jsonStart >= text.length) {
      return ["partial"];
    }
    if (!jsonText.starts(text, jsonStart)) {
      return ["invalid", matchText.length];
    }

    const jsonLen = jsonText.length(text, jsonStart);
    if (jsonLen === -1) {
      return ["partial"];
    }

    let textAfterJson = text.substr(jsonStart + jsonLen, 2);
    if (textAfterJson !== "\r\n") {
      textAfterJson = text.substr(jsonStart + jsonLen, 1);
      if (textAfterJson !== "\n") {
        return ["partial"];
      }
    }

    const jsonString = text.substr(jsonStart, jsonLen);
    return [
      "full",
      matchText.length + jsonLen + textAfterJson.length,
      {
        type: "label_json",
        ..._.mapValues(rematches.groups, unleakString),
        hash: sha1(jsonString + absPosition),
        text: jsonString,
        json: tryDecodeJson(jsonString),
      },
    ];
  }

  // we should never get here. instead, we should
  // have returned a 'partial' or 'invalid' result
  throw new Error(`Could not parse an entry: ${text}`);
}

export default function ArenaLogDecoder(): {
  append: (newtext: string, callback: any) => void;
} {
  let buffer = "";
  let bufferDiscarded = 0;
  // eslint-disable-next-line no-use-before-define
  return { append };

  function append(newText: string, callback: any): void {
    logEntryPattern.lastIndex = 0;

    // Guard against unbounded buffer growth before the concat can overflow the
    // max string length. Drop the un-parseable backlog and resync at the last
    // newline; if a single line is itself larger than the cap, drop it whole.
    if (buffer.length + newText.length > MAX_BUFFER_SIZE) {
      const resyncAt = buffer.lastIndexOf("\n") + 1;
      const drop = resyncAt > 0 ? resyncAt : buffer.length;
      bufferDiscarded += drop;
      buffer = unleakString(buffer.substr(drop));
      if (buffer.length + newText.length > MAX_BUFFER_SIZE) {
        bufferDiscarded += buffer.length;
        buffer = "";
      }
    }

    buffer = buffer.length ? buffer.concat(newText) : newText;
    let bufferUsed = 0;
    let match;
    while ((match = logEntryPattern.exec(buffer))) {
      const position = bufferDiscarded + match.index;
      const [type, length, entry] = parseLogEntry(
        buffer,
        match[0],
        match.index,
        position
      );
      switch (type) {
        case "invalid":
          bufferUsed = match.index + length;
          break;
        case "partial":
          bufferUsed = match.index;
          break;
        case "full":
          bufferUsed = match.index + length;
          callback({
            ...entry,
            position,
          });
          break;
        default:
          break;
      }
    }

    if (bufferUsed === 0) {
      const i = nthLastIndexOf(buffer, "\n", maxLinesOfAnyPattern);
      bufferUsed = i === -1 ? 0 : i;
    }

    if (bufferUsed > 0) {
      bufferDiscarded += bufferUsed;
      buffer = unleakString(buffer.substr(bufferUsed));
    }

    unleakRegExp();
  }
}
