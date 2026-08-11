/**
 * Bot-draft parsing against the 2026 log format, replayed through the watcher,
 * the decoder and logEntrySwitch.
 *
 * The fixture is synthetic — hand-written lines mirroring the current client's
 * shapes (separator-free labels, `<== Label(requestId)` responses with the JSON
 * on the following line, `{"CurrentModule","Payload"}` wrappers, CardIds arrays)
 * with made-up ids and card numbers. Do not replace it with a real Player.log:
 * those carry account identifiers.
 */
import fs from "fs";
import os from "os";
import path from "path";

import backGlobalData from "../../utils/backGlobalData";
import arenaLogWatcher from "../arena-log-watcher";
import logEntrySwitch from "../logEntrySwitch";
import globalStore from "../store";

jest.setTimeout(30000);

/** Everything the handlers broadcast during the replay, in order. */
const postedMessages: { type: string }[] = [];

const EVENT = "QuickDraft_TST_20990101";
const COURSE_ID = "aaaaaaaa-0000-0000-0000-000000000001";

const req = (label: string, request: Record<string, unknown>): string =>
  `[UnityCrossThreadLogger]==> ${label} ${JSON.stringify({
    id: "ffffffff-0000-0000-0000-00000000000f",
    request: JSON.stringify(request),
  })}\n`;

const res = (label: string, body: Record<string, unknown>): string =>
  `<== ${label}(ffffffff-0000-0000-0000-00000000000f)\n${JSON.stringify(
    body
  )}\n`;

const botDraftRes = (label: string, payload: Record<string, unknown>): string =>
  res(label, { CurrentModule: "BotDraft", Payload: JSON.stringify(payload) });

const FIXTURE = [
  req("EventJoin", { EventName: EVENT }),
  res("EventJoin", {
    Course: {
      CourseId: COURSE_ID,
      InternalEventName: EVENT,
      CurrentModule: "BotDraft",
      ModulePayload: "",
      CourseDeckSummary: { Attributes: [] },
      CardPool: [],
      CardStyles: [],
    },
    InventoryInfo: {},
  }),
  `[UnityCrossThreadLogger]Client.SceneChange {"fromSceneName":"EventLanding","toSceneName":"Draft","initiator":"System","context":"BotDraft"}\n`,
  req("BotDraftDraftStatus", { EventName: EVENT }),
  botDraftRes("BotDraftDraftStatus", {
    Result: "Success",
    EventName: EVENT,
    DraftStatus: "PickNext",
    PackNumber: 0,
    PickNumber: 0,
    NumCardsToPick: 1,
    DraftPack: ["900001", "900002", "900003"],
    PackStyles: [],
    PickedCards: [],
  }),
  req("BotDraftDraftPick", {
    EventName: EVENT,
    PickInfo: {
      EventName: EVENT,
      CardIds: ["900002"],
      PackNumber: 0,
      PickNumber: 0,
    },
  }),
  botDraftRes("BotDraftDraftPick", {
    Result: "Success",
    EventName: EVENT,
    DraftStatus: "PickNext",
    PackNumber: 0,
    PickNumber: 1,
    NumCardsToPick: 1,
    DraftPack: ["900004", "900005"],
    PackStyles: [],
    PickedCards: ["900002"],
  }),
  req("BotDraftDraftPick", {
    EventName: EVENT,
    PickInfo: {
      EventName: EVENT,
      CardIds: ["900004"],
      PackNumber: 0,
      PickNumber: 1,
    },
  }),
  botDraftRes("BotDraftDraftPick", {
    Result: "Success",
    EventName: EVENT,
    DraftStatus: "PickNext",
    PackNumber: 0,
    PickNumber: 2,
    NumCardsToPick: 1,
    DraftPack: ["900006"],
    PackStyles: [],
    PickedCards: ["900002", "900004"],
  }),
  // The draft's last pick: the response repeats the same coordinates with
  // DraftStatus "Completed" and an EMPTY DraftPack — it must not erase the
  // one-card pack recorded by the response above.
  req("BotDraftDraftPick", {
    EventName: EVENT,
    PickInfo: {
      EventName: EVENT,
      CardIds: ["900006"],
      PackNumber: 0,
      PickNumber: 2,
    },
  }),
  botDraftRes("BotDraftDraftPick", {
    Result: "Success",
    EventName: EVENT,
    DraftStatus: "Completed",
    PackNumber: 0,
    PickNumber: 2,
    NumCardsToPick: 1,
    DraftPack: [],
    PackStyles: [],
    PickedCards: ["900002", "900004", "900006"],
  }),
  `[UnityCrossThreadLogger]Client.SceneChange {"fromSceneName":"Draft","toSceneName":"DeckBuilder","initiator":"System","context":"deck builder"}\n`,
  req("EventSetDeckV3", {
    EventName: EVENT,
    Summary: { DeckId: "bbbbbbbb-0000-0000-0000-000000000002", DeckTileId: 0 },
    Deck: {
      MainDeck: [
        { cardId: 900002, quantity: 1 },
        { cardId: 900004, quantity: 1 },
      ],
      Sideboard: [{ cardId: 900001, quantity: 1 }],
      CommandZone: [],
      Companions: [],
    },
  }),
  req("EventGetCoursesV2", {}),
  res("EventGetCoursesV2", {
    Courses: [
      {
        CourseId: COURSE_ID,
        InternalEventName: EVENT,
        CurrentModule: "CreateMatch",
        ModulePayload: "",
        CurrentLosses: 1,
      },
    ],
  }),
].join("");

function replay(content: string): Promise<Error[]> {
  // Capture the channel traffic: DRAFT_END only exists as a broadcast, and it
  // regressed silently once already (the decoder dropped scene lines whose
  // JSON contained a space, e.g. "context":"deck builder").
  (backGlobalData as any).broadcastChannel = {
    postMessage: (m: { type: string }) => postedMessages.push(m),
  };

  const logPath = path.join(os.tmpdir(), "mtgatool-draft-spec.log");
  fs.writeFileSync(logPath, content);

  const errors: Error[] = [];
  return new Promise((resolve) => {
    arenaLogWatcher.start({
      path: logPath,
      chunkSize: 268435440,
      onLogEntry: (entry: any) => logEntrySwitch(entry),
      onError: (err: Error) => errors.push(err),
      onFinish: () => {
        fs.unlinkSync(logPath);
        resolve(errors);
      },
    });
  });
}

describe("bot draft in the 2026 log format", () => {
  let errors: Error[];

  beforeAll(async () => {
    errors = await replay(FIXTURE);
  });

  it("replays without decoder errors", () => {
    expect(errors).toEqual([]);
  });

  it("identifies the draft from the EventJoin response", () => {
    expect(globalStore.currentDraft.id).toBe(COURSE_ID);
    expect(globalStore.currentDraft.eventId).toBe(EVENT);
    expect(globalStore.currentDraft.date).not.toBe("");
  });

  it("tracks packs as they are offered", () => {
    expect(globalStore.currentDraft.packs[0][0]).toEqual([
      900001, 900002, 900003,
    ]);
    expect(globalStore.currentDraft.packs[0][1]).toEqual([900004, 900005]);
    expect(globalStore.currentDraft.currentPack).toBe(0);
    expect(globalStore.currentDraft.currentPick).toBe(2);
  });

  it("keeps the final one-card pack despite the empty Completed status", () => {
    expect(globalStore.currentDraft.packs[0][2]).toEqual([900006]);
  });

  it("tracks picks from the CardIds array", () => {
    expect(globalStore.currentDraft.picks[0][0]).toBe(900002);
    expect(globalStore.currentDraft.picks[0][1]).toBe(900004);
    expect(globalStore.currentDraft.picks[0][2]).toBe(900006);
    expect(globalStore.currentDraft.pickedCards).toEqual([
      900002, 900004, 900006,
    ]);
  });

  it("stores the submitted decklist on the draft record", () => {
    expect(globalStore.currentDraft.deckId).toBe(
      "bbbbbbbb-0000-0000-0000-000000000002"
    );
    expect(globalStore.currentDraft.deckMain).toEqual([
      { id: 900002, quantity: 1 },
      { id: 900004, quantity: 1 },
    ]);
    expect(globalStore.currentDraft.deckSide).toEqual([
      { id: 900001, quantity: 1 },
    ]);
  });

  it("emits DRAFT_END from the Completed status", () => {
    // The end signal comes from the final pick response's DraftStatus, not the
    // Draft->DeckBuilder scene line — that line's spaced JSON context ("deck
    // builder") never makes it through the decoder's bare-label pattern.
    expect(postedMessages.some((m) => m.type === "DRAFT_END")).toBe(true);
  });

  it("keeps the course, with its record, in currentCourses", () => {
    const course = globalStore.currentCourses[EVENT];
    expect(course).toBeDefined();
    expect(course.CourseId).toBe(COURSE_ID);
    expect(course.CurrentLosses).toBe(1);
  });
});

describe("human draft in the 2026 log format", () => {
  const HUMAN_EVENT = "PremierDraft_TST_20990101";
  const HUMAN_DRAFT_ID = "cccccccc-0000-4000-8000-0000000000c1";

  const HUMAN_FIXTURE = [
    req("EventJoin", { EventName: HUMAN_EVENT }),
    res("EventJoin", {
      Course: {
        CourseId: HUMAN_DRAFT_ID,
        InternalEventName: HUMAN_EVENT,
        CurrentModule: "PairSealed",
        ModulePayload: "",
        CourseDeckSummary: { Attributes: [] },
        CardPool: [],
        CardStyles: [],
      },
      InventoryInfo: {},
    }),
    // Packs arrive as notifications (1-indexed, comma-joined string)...
    `[UnityCrossThreadLogger]Draft.Notify {"draftId":"${HUMAN_DRAFT_ID}","SelfPick":1,"SelfPack":1,"PackCards":"910001,910002,910003"}\n`,
    // ...and picks as EventPlayerDraftMakePick with a GrpIds array.
    req("EventPlayerDraftMakePick", {
      DraftId: HUMAN_DRAFT_ID,
      GrpIds: [910002],
      Pack: 1,
      Pick: 1,
    }),
    res("EventPlayerDraftMakePick", { IsPickSuccessful: true }),
    `[UnityCrossThreadLogger]Draft.Notify {"draftId":"${HUMAN_DRAFT_ID}","SelfPick":2,"SelfPack":1,"PackCards":"910004,910005"}\n`,
    req("EventPlayerDraftMakePick", {
      DraftId: HUMAN_DRAFT_ID,
      GrpIds: [910005],
      Pack: 1,
      Pick: 2,
    }),
    res("EventPlayerDraftMakePick", { IsPickSuccessful: true }),
    // The 2026 completion response is the updated course, and it is the only
    // end signal a human draft gets.
    req("DraftCompleteDraft", { DraftId: HUMAN_DRAFT_ID }),
    res("DraftCompleteDraft", {
      CourseId: HUMAN_DRAFT_ID,
      InternalEventName: HUMAN_EVENT,
      CurrentModule: "DeckSelect",
      ModulePayload: "{}",
      CourseDeckSummary: { Attributes: [] },
    }),
  ].join("");

  beforeAll(async () => {
    await replay(HUMAN_FIXTURE);
  });

  it("tracks packs from Draft.Notify (1-indexed to 0-indexed)", () => {
    expect(globalStore.currentDraft.packs[0][0]).toEqual([
      910001, 910002, 910003,
    ]);
    expect(globalStore.currentDraft.packs[0][1]).toEqual([910004, 910005]);
  });

  it("tracks picks from the GrpIds array", () => {
    expect(globalStore.currentDraft.picks[0][0]).toBe(910002);
    expect(globalStore.currentDraft.picks[0][1]).toBe(910005);
    expect(globalStore.currentDraft.pickedCards).toEqual([910002, 910005]);
  });

  it("identifies the draft by DraftId and event", () => {
    expect(globalStore.currentDraft.id).toBe(HUMAN_DRAFT_ID);
    expect(globalStore.currentDraft.eventId).toBe(HUMAN_EVENT);
  });

  it("emits DRAFT_END from DraftCompleteDraft", () => {
    // One from the bot fixture's Completed status, one from here.
    const ends = postedMessages.filter((m) => m.type === "DRAFT_END");
    expect(ends.length).toBeGreaterThanOrEqual(2);
  });
});

describe("joining a non-draft event", () => {
  // Course joins fire for every queue. A ladder join has no deck attached
  // either (it arrives via the deck submit afterwards), so it must not seed
  // a draft record — this used to leave "Timeless Ranked" stubs with zero
  // picks on the drafts tab.
  const LADDER_FIXTURE = [
    req("EventJoin", { EventName: "Timeless_Ladder" }),
    res("EventJoin", {
      Course: {
        CourseId: "cccccccc-0000-0000-0000-00000000000c",
        InternalEventName: "Timeless_Ladder",
        CurrentModule: "PairingQueue",
        ModulePayload: "",
        CourseDeckSummary: { Attributes: [] },
        CardPool: [],
        CardStyles: [],
      },
      InventoryInfo: {},
    }),
  ].join("");

  beforeAll(async () => {
    await replay(LADDER_FIXTURE);
  });

  it("does not seed a draft record", () => {
    expect(globalStore.currentDraft.eventId).not.toBe("Timeless_Ladder");
    expect(globalStore.currentDraft.id).not.toBe(
      "cccccccc-0000-0000-0000-00000000000c"
    );
  });

  it("still remembers the course for other handlers", () => {
    expect(globalStore.currentCourses.Timeless_Ladder?.CourseId).toBe(
      "cccccccc-0000-0000-0000-00000000000c"
    );
  });
});
